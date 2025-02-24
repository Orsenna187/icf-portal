<!-- <script src="../../pdfjs-4.10.38-dist/build/pdf.mjs" type="module"></script> -->

<script>
    import * as PDFJS from "pdfjs-dist";
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import MdiFilePdfBox from 'virtual:icons/mdi/file-pdf-box';

    // Set worker using the local worker file
    PDFJS.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.js',
        import.meta.url
    ).toString();

    let pdfFiles = [];
    let selectedPdf = null;
    let showViewer = false;

    onMount(async () => {
        const dev = process.env.NODE_ENV === 'development';
        const basePath = dev ? '' : '/icf-portal';
        pdfFiles = [{
            name: 'demo_icf.pdf', 
            url: `${basePath}/demo_icf.pdf`
        }];
    });

    async function loadPDF(node, url) {
        const loadingTask = PDFJS.getDocument(url);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        
        const containerWidth = node.parentElement.clientWidth - 64;
        const viewport = page.getViewport({ scale: 1.0 });
        
        // Scale to fit container width
        const scale = containerWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });
        
        node.height = scaledViewport.height;
        node.width = scaledViewport.width;
        
        await page.render({
            canvasContext: node.getContext("2d"),
            viewport: scaledViewport,
        });
    }

    function openPdf(pdf) {
        selectedPdf = pdf;
        showViewer = true;
    }

    function closeViewer() {
        showViewer = false;
        selectedPdf = null;
    }
</script>

<div class="flex-1 relative overflow-hidden mb-16">
    <div class="relative flex flex-col gap-2 px-4">
        {#each pdfFiles as pdf}
            <label class="flex items-center gap-3 p-3 bg-base-200 rounded-lg cursor-pointer hover:bg-base-300">
                <MdiFilePdfBox class="w-8 h-8 text-error"/>
                <span class="flex-grow">{pdf.name}</span>
                <button 
                    class="btn btn-primary btn-sm"
                    onclick={() => openPdf(pdf)}
                >
                    View PDF
                </button>
            </label>
        {/each}
    </div>
</div>

{#if showViewer && selectedPdf}
    <div 
        class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        onclick={closeViewer}
        onkeydown={closeViewer}
        role="presentation"
    >
        <div 
            class="card bg-base-100 w-full max-w-[800px] max-h-[calc(100vh-8rem)] overflow-auto"
            onclick={d => d.stopPropagation()}
            role="dialog"
            aria-modal="true"
        >
            <div class="card-body relative">
                <button 
                    class="btn btn-sm btn-circle absolute right-2 top-2"
                    onclick={closeViewer}
                >
                    ✕
                </button>
                <canvas use:loadPDF={selectedPdf.url}></canvas>
            </div>
        </div>
    </div>
{/if}