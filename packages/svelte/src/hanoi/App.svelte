<script>
    import Column from './Column.svelte';
    import { towers } from './Store.js';
    import { beforeUpdate, afterUpdate } from 'svelte';
    import {fly} from 'svelte/transition';

    let size = $towers.size;
</script>

<style>
    :global(body) {
        display: flex;
    }

    .container {
        display: flex;
        flex-direction: column;
        flex-wrap: nowrap;
        flex-grow: 1;
    }

    .dash {
        flex-grow: 0;
    }

    .columns {
        flex-grow: 1;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        grid-template-rows: 1fr;
    }
</style>

<svelte:body
    on:keydown={e => {
        switch (e.key) {
            case '1':
            case '2':
            case '3':
                towers.selectTower(e.key - 1);
                break;
            case 's':
            case 'S':
                document.getElementById('level').focus();
                break;
            case 'Escape':
                towers.selectTower(null);
                break;
        }
    }} />
<div class="container">
    <div class="dash">
        <label>
            Level:
            <input
                id="level"
                type="number"
                min="3"
                max="11"
                step="1"
                bind:value={size}
                on:keypress|stopPropagation
                on:change={() => towers.setSize(size)} />
        </label>
    </div>

    {#if $towers.error}
        <div class="dash" transition:fly={{y: -100}} >{$towers.error}</div>
    {/if}

    <div class="columns">
        {#each $towers.towers as data, index (data.id)}
            <Column {data} on:click={() => towers.selectTower(index)} />
        {/each}
    </div>
</div>
