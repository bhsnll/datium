import {Picker} from 'src/pickers/Picker';
import ViewManager from 'src/common/ViewManager';
import clockTemplate from 'src/pickers/clock.html!text';
import {onDrag, onTap} from 'src/common/Events';
import TimePicker from 'src/pickers/TimePicker';
import Header from 'src/header/Header';
import {IDatiumOptions} from 'src/DatiumOptions';

export default class HourPicker extends TimePicker {
    
	constructor(container:HTMLElement, viewManager:ViewManager, header:Header, opts:IDatiumOptions) {
        
        super(container, viewManager, 'datium-hour', header, opts);
        
        onTap(container, 'datium-meridiem-switcher', () => {
           this.switchMeridiem();
        });
    }
    
    protected updateTimeBubbleElement():void {
        let timeBubbleRotation = -this.rotation;
        let t = this.time;
        if (this.meridiem === 'PM') {
            t += 12;    
        }
        if (t === 12) t = 0;
        if (t === 24) t = 12;
        
        // Silly D.L.S. time stuff
        let d = new Date(this.date.valueOf());
        d.setHours(t);
        t = d.getHours();
        
        if (this.opts.militaryTime) {
            this.timeBubbleElement.innerHTML = this.padNum(t) + 'h';
        } else {
            if (t > 12) t -= 12;
            if (t === 0) t += 12;
            this.timeBubbleElement.innerHTML = this.padNum(t) + this.meridiem;
        }
        (<any>this.timeBubbleElement.style).msTransform = `rotate(${timeBubbleRotation}deg)`;
        this.timeBubbleElement.style.webkitTransform = `rotate(${timeBubbleRotation}deg)`;      
        this.timeBubbleElement.style.transform = `rotate(${timeBubbleRotation}deg)`;        
    }    
    
    protected updateHeaderTime():void {
        let date = new Date(this.date.valueOf());
        let hours = this.time;
        if (this.meridiem === 'PM' && hours !== 12) {
            hours += 12;
        } else if (this.meridiem === 'AM' && hours === 12) {
            hours = 0;
        }
        date.setHours(hours);
        this.header.updateDayLabel(date);
    }
    
    protected dragMove(e:Event):void {
        let lastTime = this.time;
        super.dragMove(e);
        if (this.shouldSwitchMeridiem(lastTime, this.time)) {
            this.switchMeridiem();
        }
    }
    
    protected shouldSwitchMeridiem(lastTime:number, newTime:number):boolean {
        if (lastTime !== newTime) {
            if (Math.round((this.rotation + 15) / 360) % 2 === 0) {
                if (this.meridiem === 'PM') return true;
            } else {
                if (this.meridiem === 'AM') return true;
            }
        }
        return false;
    }
    
    protected getZoomToTime():number {
        let zoomToTime = this.meridiem === 'PM' ? this.time + 12 : this.time;
        if (zoomToTime === 12 || zoomToTime === 24) zoomToTime -= 12;
        return zoomToTime;
    }
    
    private switchMeridiem():void {
        this.meridiem = this.meridiem === 'AM' ? 'PM' : 'AM';
        
        let ticks = this.clockElement.querySelectorAll('datium-tick');
        for (let key in ticks) {
            if (typeof ticks[key] !== 'object') continue;
            let tickLabel = <HTMLElement>ticks[key].querySelector('datium-span');
            if (tickLabel === null) continue;
            let dataVal = parseInt(tickLabel.getAttribute('datium-data'));
            if (this.isInactive(dataVal)) {
                ticks[key].classList.add('datium-time-inactive');
            } else {
                ticks[key].classList.remove('datium-time-inactive');
            }
            let newText = this.getLabelFromTickPosition(dataVal);
            tickLabel.innerHTML = `${newText}<datium-bubble>${newText}</datium-bubble>`;
        }
        this.updateCurrentTimeElement();
        this.updateMeridiemPicker();
        this.updateHeaderTime();
        this.updateTimeBubbleElement();
    }   
    
    protected isInactive(data:number):boolean {
        let time = this.meridiem === 'PM' ? data + 12 : data;
        if (time === 12) time = 0;
        if (time === 24) time = 12;
        if (this.opts.minDate !== void 0) {
            let endDate = new Date(this.date.getFullYear(), this.date.getMonth(), this.date.getDate(), time + 1, 0, 0, 1);
            if (endDate.valueOf() < this.opts.minDate.valueOf()) return true;
        }
        
        if (this.opts.maxDate !== void 0) {
            let startDate = new Date(this.date.getFullYear(), this.date.getMonth(), this.date.getDate(), time, 0, 0, -1);
            if (startDate.valueOf() > this.opts.maxDate.valueOf()) return true;
        }
        
        return false;
    }
    
    private updateMeridiemPicker():void {     
        if (this.meridiem === 'AM') {
            this.clockElement.classList.remove('datium-pm');
            this.clockElement.classList.add('datium-am');
        } else {
            this.clockElement.classList.remove('datium-am');
            this.clockElement.classList.add('datium-pm');
        }
    }
    
    protected populatePicker(picker:HTMLElement, date:Date):void {
        super.populatePicker(picker, date);
        this.updateMeridiemPicker();
        if (this.opts.militaryTime) {
            this.clockElement.classList.add('datium-military-time');
        }
    }
    
    protected getLabelFromTickPosition(tickPosition:number):string {
        let t = tickPosition;
        if (this.meridiem === 'PM') {
            t += 12;    
        }
        if (t === 12) t = 0;
        if (t === 24) t = 12;
                
        // Silly D.L.S. time stuff
        let d = new Date(this.date.valueOf());
        d.setHours(t);
        t = d.getHours();
        
        if (this.opts.militaryTime) {            
            return (t < 10 ? '0' + t : t.toString());
        } else {
            if (t > 12) return (t - 12).toString();
            if (t === 0) return "12";
            return t.toString();
        }
    }
    
    protected getCurrentTimeRotation(date:Date, selectedDate:Date):number {
        if (date.getFullYear() === selectedDate.getFullYear() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getDate() === selectedDate.getDate()) {
            if ((this.meridiem === 'PM' && selectedDate.getHours() <= 11) ||
                (this.meridiem === 'AM' && selectedDate.getHours() >= 12)) {
               return void 0; 
            }
            return this.timeToRotation(selectedDate.getHours());    
        }
        return void 0;
    }
    
    protected rotationToTime(rotation:number):number {
        let num = rotation / 30 - 6;
        num = Math.round(num < 0 ? num + 12 : num);
        num = Math.round(num / this.opts.hourSelectionInterval) * this.opts.hourSelectionInterval;
        while(num < 0) num += 12;
        while(num > 12) num -= 12;
        return num === 0 ? 12 : num;
    }
    
    protected timeToRotation(time:number):number {
        return this.normalizeRotation(time * 30 + 180);
    }
    
    protected setInitialTime(date:Date):void {
        this.time = date.getHours() > 12 ? date.getHours() - 12 : date.getHours();
        if (this.time === 0) this.time = 12;
    }
    
    protected updateHandElements():void {
        (<any>this.hourHandElement.style).msTransform = `rotate(${this.rotation}deg)`;
        this.hourHandElement.style.webkitTransform = `rotate(${this.rotation}deg)`;   
        this.hourHandElement.style.transform = `rotate(${this.rotation}deg)`;        
    }
    
    protected getDataFromTickPosition(tickPosition:number):number {
        return tickPosition;        
    }       
    
}