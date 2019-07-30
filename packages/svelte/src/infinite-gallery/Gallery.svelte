<script>
    import Infinite from './gallery/Infinite.svelte';
    import Paged from './gallery/Pages.svelte';
    import { images, menu } from './store';

    images.loadMore();
    $: api = images.setApiBaseUrl($menu.selected.animal);
    $: type = $menu.selected.scroll === 'Infinite' ? Infinite : Paged;

    const loadMore = () => {
        images.loadMore().then(images.loadMore);
    };
</script>

<svelte:component this={type} items={$images.data} on:needMoreImages={loadMore} />
