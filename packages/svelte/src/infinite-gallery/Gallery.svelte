<script>
    import Infinite from './gallery/Infinite.svelte';
    import Paged from './gallery/Pages.svelte';
    import { images, menu } from './store';

    images.loadMore();
    $: api = images.setApiBaseUrl($menu.selected.animal);
    $: type = $menu.selected.scroll === 'Infinite' ? Infinite : Paged ;

</script>
<svelte:component this={type} />