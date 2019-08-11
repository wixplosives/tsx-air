<script>
    import { onMount } from 'svelte';
    import clamp from 'lodash/clamp';
    export let url;
    let x = 0,
        y = 0,
        loaded = false,
        limitingAxis,
        imageAspectRatio,
        scaleFactor;

    onMount(() => {
        imgElm.onload = () => {
            limitingAxis =
                imgElm && imgElm.width / imgElm.naturalWidth < imgElm.height / imgElm.naturalHeight
                    ? 'w'
                    : 'h';
            imageAspectRatio = imgElm && imgElm.naturalWidth / imgElm.naturalHeight;

            scaleFactor =
                limitingAxis === 'h'
                    ? mainElm.clientHeight / imgElm.naturalHeight
                    : mainElm.clientWidth / imgElm.naturalWidth;
            loaded = true;
        };
    });
    const setZoom = e => {
        if (!loaded) return;
        const rect = imgElm.getClientRects()[0];
        const h = limitingAxis === 'h' ? imgElm.clientHeight : imgElm.clientWidth / imageAspectRatio;

        let [nx, ny] = [e.pageX - rect.x - width / 2, e.pageY - rect.y - height / 2];

        [x, y] = [clamp(nx, -1, h * imageAspectRatio - width - 1), clamp(ny, -1, h - height - 1)];
    };

    let mainElm, imgElm;

    $: zoomAspectRatio =
        (mainElm && mainElm.clientWidth / mainElm.clientHeight) || window.innerWidth / window.innerHeight;

    $: s=imgElm && width/imgElm.naturalWidth || 1;
    $: width = (imgElm && imgElm.clientWidth * scaleFactor) || 0;
    $: height = width / zoomAspectRatio || 0;
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
            style="left:{(-x) / s}px; top:{(-y) / s }px" />
    </div>

    <div class="zoomedOut">
        <img src={url} alt="Cute animal, zoomed out" bind:this={imgElm} />
        <div class="zoomed" style="height:{height}px; width:{width}px; top:{y}px; left:{x}px;" />
    </div>
</div>
