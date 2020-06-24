import { TSXAir, store } from '@tsx-air/framework';
import clamp from 'lodash/clamp';
// tslint:disable: jsx-no-lambda

export const Mousy = TSXAir(() => {
    const state = store({ x: 0, y: 0, frame:0 });

    return <div className="stage" onMouseMove={e => {
        const _pos = e.currentTarget?.getClientRects();
        const pos = _pos['0'];
        state.x = clamp(e.x - pos.left - 10, 0, pos.width);
        state.y = clamp(e.y - pos.top - 10, 0, pos.height);
    }}>
        <div className="x" style={{ left: `${state.x + 7}px`, top: `0` }} />
        <div className="y" style={{ left: `0`, top: `${state.y + 7}px` }} />
        <div className="mover" style={{ left: `${state.x}px`, top: `${state.y}px` }} />
    </div>
});
