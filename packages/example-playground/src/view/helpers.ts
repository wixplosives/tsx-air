import { compilers } from './../compilers';
import dom from './dom';
import { stats } from '../framework';

// @ts-ignore
window.scrollTo(localStorage.getItem('scrollX'), localStorage.getItem('scrollY'));
window.addEventListener('scroll', () => {
    localStorage.setItem('scrollX', '' + window.scrollX);
    localStorage.setItem('scrollY', '' + window.scrollY);
});


stats.startFpsProbe();

setInterval(() => {
    dom.fps.innerText = 'Fps: ' + stats.getFps() || '';
    if (Math.random() < 0.0001) {
        const i = new Image();
        i.src = '/images/homer.png';
        i.classList.add('h');
        i.addEventListener('animationend', () => i.remove());
        i.onload = () => document.body.appendChild(i);
    }
}, 100);

dom.selectCompiler.innerHTML = `${compilers.map((compiler, i) =>
    `<option value="${i}">${compiler.label}</option>`).join('\n')}`;
dom.selectCompiler.value = localStorage.getItem('selected-compiler') || '0';
