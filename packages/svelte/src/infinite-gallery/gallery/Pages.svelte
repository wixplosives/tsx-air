<script>
    import Preloader from '../Preloader.svelte';
    import Thumb from '../Thumb.svelte';
    import { images, menu } from '../store';
    import { afterUpdate } from 'svelte';

    images.loadMore();
    $: api = images.setApiBaseUrl($menu.selected.animal);
    let page = 0;
    let itemsPerPage = 3 * 4;
    const getPage = page => {
        if (page * itemsPerPage < $images.data.length + 10) {
            images.loadMore().then(() => images.loadMore());
        }
        return $images.data.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
    };
    $: displayedImages = getPage(page);
</script>

<style>
    .gallery {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-evenly;
    }

    button {
        position: fixed;
        top: 50%;
        right: 0;
        border-radius: 50%;
        height: 2em;
        width: 2em;
        font-size: 2em;
        border: 0;
        background: radial-gradient(ellipse at top, #ccc, #fff),
            radial-gradient(farthest-corner at 40px 40px, #bbb, transparent);
    }
    button:hover {
        background: radial-gradient(ellipse at top, #aaa, #eee),
            radial-gradient(farthest-corner at 40px 40px, #ccc, transparent);
    }
    button::after {
        content: '>';
    }
    .prev::after {
        content: '<';
    }
    .prev {
        left: 0;
        right: none;
    }

    .hidden {
        display: none;
    }
</style>

<div class="gallery">
    <button class="prev" class:hidden={page <= 0} on:click={() => page--} />
    <button
        on:click={() => {
            page++;
            images.loadMore();
        }} />
    {#each displayedImages as { url } (url)}
        <Thumb {url} />
    {/each}
</div>
