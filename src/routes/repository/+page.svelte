<script>
    import { onMount } from 'svelte';
    import { getStorage, ref, listAll, getDownloadURL, getMetadata, uploadBytes, deleteObject } from 'firebase/storage';
    import MdiFolder from 'virtual:icons/mdi/folder';
    import MdiFile from 'virtual:icons/mdi/file';
    import MdiDownload from 'virtual:icons/mdi/download';
    import MdiEye from 'virtual:icons/mdi/eye';
    import MdiArrowLeft from 'virtual:icons/mdi/arrow-left';
    import MdiUpload from 'virtual:icons/mdi/upload';
    import MdiFolderPlus from 'virtual:icons/mdi/folder-plus';
    import MdiDotsVertical from 'virtual:icons/mdi/dots-vertical';
    import MdiDelete from 'virtual:icons/mdi/delete';
    import { storage } from '../../lib/firebase';
    
    let repositoryItems = [];
    let isLoading = true;
    let error = null;
    let currentPath = 'study_team_repository';
    let showCreateFolderModal = false;
    let newFolderName = '';
    let fileInput;
    let showDeleteModal = false;
    let itemToDelete = null;
    let activeDropdown = null;
    let dropdownPosition = { x: 0, y: 0 };
    let dropdownButton;
    
    // Security constants
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    const ALLOWED_FILE_TYPES = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    function sanitizeFileName(fileName) {
      // Remove any path traversal attempts and special characters
      return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    }
    
    function validateFolderName(name) {
      // Check for path traversal attempts and invalid characters
      if (name.includes('..') || name.includes('/') || name.includes('\\')) {
        throw new Error('Invalid folder name. Cannot contain path traversal characters.');
      }
      if (name.length > 255) {
        throw new Error('Folder name is too long.');
      }
      return name.trim();
    }
    
    async function loadRepositoryContents(path) {
      try {
        isLoading = true;
        error = null;
        
        // Validate path to prevent traversal
        if (!path.startsWith('study_team_repository')) {
          throw new Error('Invalid path');
        }
        
        const pathRef = ref(storage, path);
        const result = await listAll(pathRef);
        
        // Process folders
        const folders = result.prefixes.map(prefix => ({
          name: prefix.name,
          path: prefix.fullPath,
          isFolder: true
        }));
        
        // Process files
        const files = await Promise.all(result.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          const metadata = await getMetadata(itemRef);
          return {
            name: itemRef.name,
            path: itemRef.fullPath,
            url,
            contentType: metadata.contentType,
            size: formatFileSize(metadata.size),
            updatedAt: new Date(metadata.updated)
          };
        }));
        
        // Filter out .folder files and combine items
        repositoryItems = [...folders, ...files.filter(file => file.name !== '.folder')].sort((a, b) => {
          if (a.isFolder && !b.isFolder) return -1;
          if (!a.isFolder && b.isFolder) return 1;
          return a.name.localeCompare(b.name);
        });
        
      } catch (err) {
        console.error("Error loading repository contents:", err);
        error = err.message;
      } finally {
        isLoading = false;
      }
    }
    
    async function handleFileUpload(event) {
      const files = event.target.files;
      if (!files.length) return;
      
      try {
        isLoading = true;
        error = null;
        
        const uploadPromises = Array.from(files).map(async (file) => {
          // Validate file size
          if (file.size > MAX_FILE_SIZE) {
            throw new Error(`File ${file.name} is too large. Maximum size is 50MB.`);
          }
          
          // Validate file type
          if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            throw new Error(`File type not allowed: ${file.name}`);
          }
          
          // Sanitize file name
          const safeFileName = sanitizeFileName(file.name);
          const fileRef = ref(storage, `${currentPath}/${safeFileName}`);
          await uploadBytes(fileRef, file);
        });
        
        await Promise.all(uploadPromises);
        await loadRepositoryContents(currentPath);
      } catch (err) {
        console.error("Error uploading files:", err);
        error = err.message;
      } finally {
        isLoading = false;
      }
    }
    
    async function createNewFolder() {
      if (!newFolderName.trim()) return;
      
      try {
        isLoading = true;
        error = null;
        
        // Validate folder name
        const safeFolderName = validateFolderName(newFolderName);
        
        // Create a folder by uploading an empty file with a special name
        const folderRef = ref(storage, `${currentPath}/${safeFolderName}/.folder`);
        await uploadBytes(folderRef, new Blob([]));
        
        showCreateFolderModal = false;
        newFolderName = '';
        await loadRepositoryContents(currentPath);
      } catch (err) {
        console.error("Error creating folder:", err);
        error = err.message;
      } finally {
        isLoading = false;
      }
    }
    
    function formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' bytes';
      else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      else return (bytes / 1048576).toFixed(1) + ' MB';
    }
    
    function formatDate(date) {
      return new Intl.DateTimeFormat('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }).format(date);
    }

    function navigateToFolder(path) {
      currentPath = path;
      loadRepositoryContents(path);
    }

    function navigateUp() {
      const parentPath = currentPath.split('/').slice(0, -1).join('/');
      if (parentPath) {
        currentPath = parentPath;
        loadRepositoryContents(parentPath);
      }
    }

    async function deleteItem(item) {
      try {
        isLoading = true;
        error = null;
        
        if (item.isFolder) {
          // For folders, we need to delete all contents first
          const folderRef = ref(storage, item.path);
          const result = await listAll(folderRef);
          
          // Delete all files in the folder
          const deletePromises = result.items.map(async (fileRef) => {
            await deleteObject(fileRef);
          });
          
          // Delete all subfolders
          const deleteFolderPromises = result.prefixes.map(async (prefix) => {
            await deleteObject(prefix);
          });
          
          await Promise.all([...deletePromises, ...deleteFolderPromises]);
        } else {
          // For files, just delete the file
          const fileRef = ref(storage, item.path);
          await deleteObject(fileRef);
        }
        
        showDeleteModal = false;
        itemToDelete = null;
        await loadRepositoryContents(currentPath);
      } catch (err) {
        console.error("Error deleting item:", err);
        error = err.message;
      } finally {
        isLoading = false;
      }
    }

    function showDropdown(event, item) {
      event.stopPropagation();
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      dropdownPosition = {
        x: rect.right - 208, // 208px is the width of the dropdown (w-52)
        y: rect.bottom + 4
      };
      activeDropdown = item;
    }
    
    function hideDropdown() {
      activeDropdown = null;
    }

    onMount(() => {
      loadRepositoryContents(currentPath);
      document.addEventListener('click', hideDropdown);
    });

    onMount(() => {
      return () => {
        document.removeEventListener('click', hideDropdown);
      };
    });
</script>

<div class="container mx-auto p-6 max-w-8xl">
  <div class="mb-8">
    <h1 class="text-3xl font-bold mb-2">Study Team Repository</h1>
    <p class="text-base-content/70">Access study team documents and resources</p>
  </div>

  <!-- Current path and back button -->
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-4">
      {#if currentPath !== 'study_team_repository'}
        <button 
          class="btn btn-ghost btn-sm" 
          on:click={navigateUp}
        >
          <MdiArrowLeft class="w-5 h-5" />
        </button>
      {/if}
      <div class="text-sm breadcrumbs">
        <ul>
          <li><a href="#" on:click|preventDefault={() => navigateToFolder('study_team_repository')}>Repository</a></li>
          {#each currentPath.split('/').slice(1) as segment, i}
            <li>
              <a href="#" on:click|preventDefault={() => navigateToFolder(currentPath.split('/').slice(0, i + 2).join('/'))}>
                {segment}
              </a>
            </li>
          {/each}
        </ul>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="flex gap-2">
      <button 
        class="btn btn-primary btn-sm"
        on:click={() => fileInput.click()}
      >
        <MdiUpload class="w-4 h-4 mr-1" />
        Upload Files
      </button>
      <input 
        type="file" 
        multiple 
        class="hidden" 
        bind:this={fileInput}
        on:change={handleFileUpload}
      />
      
      <button 
        class="btn btn-primary btn-sm"
        on:click={() => showCreateFolderModal = true}
      >
        <MdiFolderPlus class="w-4 h-4 mr-1" />
        New Folder
      </button>
    </div>
  </div>
  
  {#if isLoading}
    <div class="flex justify-center my-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  {:else if error}
    <div class="alert alert-error">
      <span>Error loading repository contents: {error}</span>
    </div>
  {:else if repositoryItems.length === 0}
    <div class="alert alert-info">
      <span>This folder is empty.</span>
    </div>
  {:else}
    <div class="bg-base-100 rounded-lg shadow relative">
      <div class="overflow-x-auto">
        <table class="table w-full">
          <thead>
            <tr>
              <th class="w-8"></th>
              <th>Name</th>
              <th class="w-32">Size</th>
              <th class="w-40">Last Modified</th>
              <th class="w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each repositoryItems as item}
              <tr class="hover:bg-base-200 cursor-pointer">
                <td>
                  {#if item.isFolder}
                    <MdiFolder class="w-5 h-5 text-primary" />
                  {:else}
                    <MdiFile class="w-5 h-5 text-primary" />
                  {/if}
                </td>
                <td>
                  {#if item.isFolder}
                    <button 
                      class="text-left"
                      on:click={() => navigateToFolder(item.path)}
                    >
                      {item.name}
                    </button>
                  {:else}
                    <button 
                      class="text-left"
                      on:click={() => window.open(item.url, '_blank')}
                    >
                      {item.name}
                    </button>
                  {/if}
                </td>
                <td>{item.isFolder ? '-' : item.size}</td>
                <td>{item.isFolder ? '-' : formatDate(item.updatedAt)}</td>
                <td>
                  <div class="flex gap-2 justify-end">
                    {#if !item.isFolder}
                      <a href={item.url} target="_blank" class="btn btn-ghost btn-xs">
                        <MdiEye class="w-4 h-4" />
                      </a>
                      <a href={item.url} download={item.name} class="btn btn-ghost btn-xs">
                        <MdiDownload class="w-4 h-4" />
                      </a>
                    {/if}
                    <div class="relative">
                      <button 
                        class="btn btn-ghost btn-xs" 
                        on:click={(e) => showDropdown(e, item)}
                      >
                        <MdiDotsVertical class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<!-- Create Folder Modal -->
{#if showCreateFolderModal}
  <div class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">Create New Folder</h3>
      <div class="form-control">
        <label class="label">
          <span class="label-text">Folder Name</span>
        </label>
        <input 
          type="text" 
          class="input input-bordered" 
          bind:value={newFolderName}
          placeholder="Enter folder name"
        />
      </div>
      <div class="modal-action">
        <button class="btn" on:click={() => showCreateFolderModal = false}>Cancel</button>
        <button class="btn btn-primary" on:click={createNewFolder}>Create</button>
      </div>
    </div>
  </div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && itemToDelete}
  <div class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">Confirm Delete</h3>
      <p>Are you sure you want to delete {itemToDelete.isFolder ? 'the folder' : 'the file'} "{itemToDelete.name}"?</p>
      {#if itemToDelete.isFolder}
        <p class="text-sm text-error mt-2">Warning: This will delete all contents of the folder.</p>
      {/if}
      <div class="modal-action">
        <button class="btn" on:click={() => {
          showDeleteModal = false;
          itemToDelete = null;
        }}>Cancel</button>
        <button class="btn btn-error" on:click={() => deleteItem(itemToDelete)}>Delete</button>
      </div>
    </div>
  </div>
{/if}

<!-- Dropdown Menu -->
{#if activeDropdown}
  <div 
    class="fixed z-[1000] bg-base-100 shadow-lg rounded-box w-52"
    style="left: {dropdownPosition.x}px; top: {dropdownPosition.y}px;"
  >
    <ul class="menu p-2">
      <li>
        <button 
          class="text-error"
          on:click={() => {
            itemToDelete = activeDropdown;
            showDeleteModal = true;
            hideDropdown();
          }}
        >
          <MdiDelete class="w-4 h-4" />
          Delete {activeDropdown.isFolder ? 'Folder' : 'File'}
        </button>
      </li>
    </ul>
  </div>
{/if}


