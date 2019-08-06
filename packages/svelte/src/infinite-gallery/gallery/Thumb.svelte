<script>
    import Preloader from '../Preloader.svelte';
    import { onMount, tick, onDestroy } from 'svelte';
    import { fade } from 'svelte/transition';

    export let url;
    let parent;
    let loaded = false;
    let img = new Image();
    
    onMount(() => {
        img.src = url;
        img.style = `object-fit: cover;
            height: 100%;
            width: 100%;`;
            img.alt = "a very cute animal"
        img.onload = async () => {
            loaded = true;
            await tick();
            parent && parent.appendChild(img);
        };
    });

    onDestroy(() => {
        if (img) {
            img.src = null;
        }
        img = null;
    });
</script>

<style>
    .thumb {
        padding: 0.5em;
        margin: 0.5em;
        overflow: hidden;
        height: 20vw;
        width: 20vw;
        display: flex;
        justify-content: center;
        align-items: center;
        background: #eef;
    }

    .thumb > div {
        width: 100%;
        height: 100%;
    }
</style>

<div class="thumb" on:click>
    {#if !loaded}
        <Preloader />
    {:else}
        <div transition:fade bind:this={parent} />
    {/if}
</div>
