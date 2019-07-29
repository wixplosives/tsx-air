<script>
    import Preloader from '../Preloader.svelte';
    import Thumb from '../Thumb.svelte';
    import { images, menu } from '../store';

    images.loadMore();
    $: api = images.setApiBaseUrl($menu.selected.animal);
</script>

<style>
    .gallery {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-evenly;
    }
</style>

<svelte:window
    on:scroll={() => {
        if (document.body.scrollHeight + document.body.getClientRects()[0].y - document.body.getClientRects()[0].height < 20) {
            images.loadMore();
        }
    }} />

<div class="gallery">
    {#each $images.data as { url }}
        <Thumb {url} />
    {/each}
    {#await $images.loading}
        <Thumb url={null} />
    {:then}
        <div />
    {:catch}
        <div />
    {/await}
</div>
