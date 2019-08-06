<script>
    import { onMount } from 'svelte';
    import clamp from 'lodash/clamp';
    export let url;
    let x = 10,
        y = 10;

    const setZoom = e => {
        const rect = imgElm.getClientRects()[0];
        let [nx, ny] = [e.pageX - rect.x - width / 2, e.pageY - rect.y - height / 2];
        
        console.log(nx, ny,
        clamp(-1, ratio * imgElm.naturalWidth - width - 1, nx),
            clamp(-1, ratio * imgElm.naturalHeight - height - 1, ny)
        );
        
        [x, y] = [
            clamp(-1, ratio * imgElm.naturalWidth - width - 1, nx),
            clamp(-1, ratio * imgElm.naturalHeight - height - 1, ny)
        ];
    };
    let mainElm, imgElm, zoomedImgElm;

    // $: width = imgElm.naturalWidth;
    // $: height = imgElm.naturalHeight;
    $: ratio =
        (imgElm && Math.max(imgElm.clientWidth / imgElm.naturalWidth, imgElm.clientHeight / imgElm.naturalHeight)) || 1;
    $: aspectRatio = (mainElm && mainElm.clientWidth / mainElm.clientHeight) || window.innerWidth / window.innerHeight;

    $: width = (imgElm && imgElm.clientWidth * ratio) || 0;
    $: height = width / aspectRatio || 0;
</script>

<style>
    .zoom {
        position: relative;
        height: 100%;
        width: 100%;
    }
    .zoomedOut {
        position: absolute;
        width: 30%;
        height: 30%;
        top: 5%;
        left: 5%;
        overflow: visible;
    }

    .zoomedOut img {
        object-position: left;
        filter: drop-shadow(0.5em 0.5em 1em);
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
    .zoomed {
        border: red solid 2px;
        position: absolute;
    }
    .zoomedIn {
        width: 100%;
        height: 100%;
        overflow: hidden;
        position: relative;
    }
    .zoomedIn img {
        position: absolute;
        object-fit: none;
    }
</style>

<div class="zoom" bind:this={mainElm} on:click|stopPropagation on:mousemove={setZoom}>
    <div class="zoomedIn">
        <img
            src={url}
            alt="Cute animal, up close"
            bind:this={zoomedImgElm} />
            <!-- style="left:{-x / ratio}px; top:{-y / ratio}px" /> -->
    </div>

    <div class="zoomedOut">
        <img src={url} alt="Cute animal, zoomed out" bind:this={imgElm} />
        <div class="zoomed" style="height:{height}px; width:{width}px; top:{y}px; left:{x}px;" />
    </div>
</div>
