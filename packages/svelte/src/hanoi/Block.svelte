<script>
    import { fly } from 'svelte/transition';
    export let size;
    export let selected;
    let miniblocks = new Array(size);
</script>

<style>
    .block {
        background-color: gray;
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        border-radius: 20%;
    }

    .unit {
        display: inline-block;
        width: 2vw;
        height: 5vh;
        border: solid black 1px;
        background-color: red;
        border-radius: 20%;
    }

    .unit.selected {
        background-color: greenyellow;
    }
</style>

<div class="block">
    {#each miniblocks as _}
        <div class="unit" class:selected transition:fly>
        </div>
    {/each}
</div>