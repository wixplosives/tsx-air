<script>
    import Infinite from './gallery/Infinite.svelte';
    import Paged from './gallery/Pages.svelte';
    import { images, menu } from './store';
    import Zoom from './gallery/Zoom.svelte';

    let zoomedImage;

    images.loadMore();
    $: api = images.setApiBaseUrl($menu.selected.animal);
    $: type = $menu.selected.scroll === 'Infinite' ? Infinite : Paged;

    const loadMore = () => {
        images.loadMore().then(images.loadMore);
    };
</script>

<style>
    .modal {
        background: rgba(0, 0, 0, 0.5);
        position: absolute;
        top: 0;
        bottom: 0;
        right: 0;
        left: 0;
        padding: 2em;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
</style>

<svelte:component
    this={type}
    items={$images.data}
    on:needMoreImages={loadMore}
    on:imageSelected={({ detail }) => (zoomedImage = detail)} />
{#if zoomedImage}
    <div class="modal" on:click={() => (zoomedImage = null)}>
        <Zoom url={zoomedImage} />
    </div>
{/if}
