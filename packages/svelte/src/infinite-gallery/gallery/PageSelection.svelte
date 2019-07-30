<script>
    export let displayedPage;
    export let count;

    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    const getPages = () => {
        const initial = [...new Array(count).keys()];

        if (displayedPage < count - 2 || count <= 2) {
            return initial;
        }
        return [0, '...', ...initial.slice(0, -1).map(i => i + displayedPage - ((count / 2) | 0))];
    };

    // Passing count, displayedPage will triger render when they change (otherwise the view will not be refreshed)
    $: pages = getPages(count, displayedPage);
</script>

<style>
    div {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    a, span {
        color: grey;
        margin: 0 0.3em;
    }
    .active {
        font-size: 1.5em;
        color: #777;
        font-weight: bold;
    }
</style>

<div>
    {#each pages as page}
        {#if isNaN(page)}
            <span>{page}</span>
        {:else}
            <a
                href="#{page}"
                on:click|preventDefault={() => dispatch('gotoPage', page)}
                class:active={page === displayedPage}>
                {page + 1}
            </a>
        {/if}
    {/each}
    <a href="#last" on:click|preventDefault={() => dispatch('gotoPage', -1)}>More</a>
</div>
