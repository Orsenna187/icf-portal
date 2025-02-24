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
        const response = {
            name: 'demo_icf.pdf', 
            url: `${basePath}/demo_icf.pdf`
        };
        pdfFiles = [response];
    });

    async function loadPDF(node, url) {
        const loadingTask = PDFJS.getDocument(url);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });
        const canvas = node;
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };
        await page.render(renderContext);
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

<main>    
    <div class="pdf-list">
        {#each pdfFiles as pdf}
            <div class="pdf-item" role="button" onclick={() => openPdf(pdf)}>
                <MdiFilePdfBox class="w-8 h-8 text-red-500"/>
                <span class="pdf-name">{pdf.name}</span>
                <span class="view-text">View PDF</span>
            </div>
        {/each}
    </div>

    {#if showViewer && selectedPdf}
        <div class="pdf-viewer" transition:fade onclick={closeViewer}>
            <div class="viewer-content" onclick={d => d.stopPropagation()}>
                <button class="close-button" onclick={closeViewer}>×</button>
                <canvas use:loadPDF={selectedPdf.url}></canvas>
            </div>
        </div>
    {/if}
</main>

<style>
    .pdf-list {
        display: grid;
        gap: 1rem;
        padding: 1rem;
        max-width: 800px;
        margin: 0 auto;
    }

    .pdf-item {
        background: #f5f5f5;
        padding: 1rem;
        border-radius: 8px;
        display: flex;
        gap: 1rem;
        align-items: center;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .pdf-item:hover {
        background: #e5e5e5;
    }

    .view-text {
        color: #2563eb;
        font-size: 0.9rem;
    }

    .pdf-viewer {
        position: fixed;
        border-radius: 8px;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .viewer-content {
        position: relative;
        background: white;
        padding: 2rem;
        margin: 0 2rem;
        border-radius: 8px;
        max-height: calc(100vh - 12rem); /* Account for navbar and padding */
        max-width: min(800px, 90vw); /* Match card max-width */
        overflow: auto;
    }

    .close-button {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        font-size: 2rem;
        cursor: pointer;
        color: #666;
    }

    .close-button:hover {
        color: #000;
    }

    canvas {
        display: block;
        max-width: 100%;
        height: auto;
    }

    .pdf-name {
        flex-grow: 1;
        text-align: left;
    }
</style>