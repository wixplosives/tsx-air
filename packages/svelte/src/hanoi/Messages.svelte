<script>
    import { scale, fade } from 'svelte/transition';
    import Message from './messages/Message.svelte';
    import api from './store';
    const { messages } = api;
</script>

<style>
    div {
        top: 0;
        left: 20%;
        right: 20%;
        position: fixed;
        display: flex;
        align-content: center;
        align-items: center;
        justify-items: center;
        justify-content: center;
        user-select: none;
    }
    ul {
        list-style: none;
        display: flex;
        flex-direction: column;
        justify-items: center;
        align-items: center;
    }

    li:last-child {
        font-size: 2em;
        text-shadow: white 10px 10px;
    }
</style>

<div>
    <ul>
        {#each $messages.messages as { message, type, id } (id)}
            <li in:scale out:fade>
                <Message {message} {type} />
            </li>
        {/each}
    </ul>
</div>
