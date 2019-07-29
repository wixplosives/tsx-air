<script>
    import { afterUpdate } from 'svelte';
    import Block from './Block.svelte';

    export let data;
    export let specialTiles;
    export let win = false;
</script>

<style>
    .column {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        flex-direction: column;
        flex: 1;
        position: relative;
        z-index: 0;
    }

    .pole {
        z-index: -1;
        position: absolute;
        left: calc(50% - 0.5vw);
        bottom: 0;
        width: 1vw;
        height: 70vh;
        background-image: linear-gradient(to right, #000, #aaa, #000);
        border-top-left-radius: 0.5vw;
        border-top-right-radius: 0.5vw;
    }

    .pole.target {
        background-image: linear-gradient(to right, #000, gold, #000);
    }
</style>

<div class="column" on:click>
    <div class="pole" class:target={data.id === 2} />
    {#each data.blocks as size, i (size)}
        <Block {size} blocktype={win ? 'bonus' : specialTiles[size]} />
    {/each}
</div>
