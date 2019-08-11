<script>
    import Thumb from './Thumb.svelte';
    import { createEventDispatcher, onMount, afterUpdate } from 'svelte';
    const dispatch = createEventDispatcher();

    export let items = [];

    const loadMoreIfNeeded = () => {
        if (
            document.body.scrollHeight +
                document.body.getClientRects()[0].y -
                document.body.getClientRects()[0].height <
            20
        ) {
            dispatch('needMoreImages');
        }
    };

    onMount(loadMoreIfNeeded);
</script>

<style>
    .gallery {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-evenly;
    }
</style>

<svelte:window on:scroll={loadMoreIfNeeded} />

<div class="gallery">
    {#each items as { url } (url)}
        <Thumb {url} on:click={() => dispatch('imageSelected', url)} />
    {/each}
</div>
