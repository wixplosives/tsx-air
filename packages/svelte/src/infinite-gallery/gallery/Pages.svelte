<script>
    import Thumb from './Thumb.svelte';
    import Page from './Page.svelte';
    import PageSelection from './PageSelection.svelte';
    import { crossfade } from 'svelte/transition';
    import { createEventDispatcher, onMount, afterUpdate } from 'svelte';
    const dispatch = createEventDispatcher();

    export let items = [];
    export let itemsPerPage = 6;
    onMount(() => {
        if (items.length / itemsPerPage < 5) {
            dispatch('needMoreImages');
        }
    });

    $: pages = items.reduce((acc, item, index) => {
        const page = (index / itemsPerPage) | 0;
        const data = acc[page] || { id: page, items: [] };
        data.items.push(item);
        acc[page] = data;
        return acc;
    }, []);

    let displayedPage = 0;
    // handy for animation
    $: page = pages[displayedPage] ? [pages[displayedPage]] : [];

    const changePage = e => {
        if (e.type === 'gotoPage') {
            displayedPage = e.detail >= 0 ? e.detail : pages.length - 1;
        } else {
            if (e.target.classList.contains('prev')) {
                displayedPage--;
            } else {
                displayedPage++;
            }
        }
        if (displayedPage >= pages.length - 2) {
            dispatch('needMoreImages');
        }
    };
    $: noPrev = displayedPage <= 0;
    $: noNext = displayedPage >= pages.length;
    $: count = Math.min(pages && pages.length, 5);
</script>

<style>
    .gallery {
        display: flex;
        flex-direction: column;
        justify-content: start;
    }
    .header {
        flex-grow: 0;
        align-self: center;
    }

    .page {
        flex-grow: 1;
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
    <button class="prev" class:hidden={noPrev} on:click={changePage} />
    <button class="next" class:hidden={noNext} on:click={changePage} />
    <div class="header">
        <PageSelection {displayedPage} {count} on:gotoPage={changePage} />
    </div>
    {#each page as { id, items } (id)}
        <!-- NOTE: transition, animation, named slots etc CAN NOT be applied to components -->
        <div transition:crossfade class="page">
            <Page>
                {#each items as { url }}
                    <Thumb {url} on:click={() => dispatch('imageSelected', url)} />
                {/each}
            </Page>
        </div>
    {/each}
</div>
