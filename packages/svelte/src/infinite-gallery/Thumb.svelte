<script>
    import Preloader from './Preloader.svelte';
    import { onMount, tick } from 'svelte';
    export let url;
    let parent;
    let loaded = false;
    onMount(() => {
        const img = new Image();
        img.src = url;
        img.onload = async () => {
            loaded = true;
            await tick();
            parent.appendChild(img);
        };
    });
</script>

<style>
    .thumb {
        margin: 2vmax;
        overflow: hidden;
        height: 20vw;
        width: 20vw;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .thumb img {
        object-fit: cover;
        height: 100%;
        width: 100%;
    }
</style>

<div class="thumb" bind:this={parent}>
    {#if !loaded}
        <Preloader />
    {/if}

</div>
