<script>
    import { tick } from 'svelte';
    import Column from './Column.svelte';
    import Messages from './Messages.svelte';
    import Timer from './Timer.svelte';
    import api from './store';
    import { fly } from 'svelte/transition';
    import { tweened } from 'svelte/motion';

    const { towers, timer, messages, selectTower, setSize } = api;
    let size = $towers.size;
    let removeAlert = true;
    let levelInput;

    let killAnimation = false;
    $: alert = $messages.messages.slice(-1)[0] && $messages.messages.slice(-1)[0].type === 'error' && !killAnimation;

    // NOTE: async/await tick() seems to fail as an inline function in template
    async function removeAnimation() {
        killAnimation = true;
        // await DOM update
        await tick();
        killAnimation = false;
    }
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

    .alert {
        animation: alert 0.1s ease-out 0s 1;
    }

    @keyframes alert {
        from {
            background-color: darkred;
        }
        to {
            background-color: none;
        }
    }

    .dash {
        display: flex;
        align-items: center;
        user-select: none;
    }
    .dash > * {
        margin-left: 2em;
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
                selectTower(e.key - 1);
                break;
            case 's':
            case 'S':
                levelInput.focus();
                break;
            case 'Escape':
                selectTower(null);
                break;
        }
    }} />

<div class="container" class:alert on:animationend={removeAnimation}>
    <div class="dash">
        <Timer on:click={() => setSize(size)} />
        <label>
            Level:
            <input
                bind:this={levelInput}
                type="range"
                min="2"
                max="11"
                step="1"
                bind:value={size}
                on:keypress|stopPropagation
                on:change={() => setSize(size)} />
        </label>
    </div>
    <Messages />

    <div class="columns">
        {#each $towers.towers as data, index (data.id)}
            <Column {data} specialTiles={$towers.specialTiles} on:click={() => selectTower(index)} win={$towers.win} />
        {/each}
    </div>
</div>
