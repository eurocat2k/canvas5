import $ from 'jquery';
import './style.css';
import { UI } from './ui';
$(function(){
    console.log(`Hello world!`);
    let ui = new UI({
        stepSize: 20,
        minPercent: 2,
        maxPercent: 200,
        minScale: 0.01,
        maxScale: 2
    });
}());