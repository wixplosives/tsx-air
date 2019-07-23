<script>
    import { beforeUpdate, afterUpdate, onMount } from 'svelte';
    import Block from './Block.svelte';
    export let data;
</script>

<style>
    .column {
        display: flex;
        /* height: 100%; */
        align-items: center;
        justify-content: flex-end;
        flex-direction: column;
        flex: 1;
        position: relative;
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
</style>

<div class="column" on:click>
    <div class="pole" />
    {#each data.blocks as size, i (size)}
        <Block {size} selected={i === 0 && data.isSelected} />
    {/each}
</div>
