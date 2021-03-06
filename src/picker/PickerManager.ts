const enum Transition {
    SLIDE_LEFT,
    SLIDE_RIGHT,
    ZOOM_IN,
    ZOOM_OUT
}

class PickerManager {
    private options:IOptions;
    public container:HTMLElement;
    public header:Header;
    
    private yearPicker:IPicker;
    private monthPicker:IPicker;
    private datePicker:IPicker;
    private hourPicker:ITimePicker;
    private minutePicker:ITimePicker;
    private secondPicker:ITimePicker;
    
    public currentPicker:IPicker;
    
    public startLevel:Level;
    
    private pickerContainer:HTMLElement;
    
    constructor(private element:HTMLInputElement) {
        this.container = this.createView();
        
        this.insertAfter(element, this.container);
        
        this.pickerContainer = <HTMLElement>this.container.querySelector('datium-picker-container');
        
        this.header = new Header(element, this.container);
        
        this.yearPicker = new YearPicker(element, this.container);
        this.monthPicker = new MonthPicker(element, this.container);
        this.datePicker = new DatePicker(element, this.container);
        this.hourPicker = new HourPicker(element, this.container);
        this.minutePicker = new MinutePicker(element, this.container);
        this.secondPicker = new SecondPicker(element, this.container);
                
        listen.down(this.container, '*', (e) => { this.addActiveClasses(e) });
        
        listen.up(document, () => {
            this.closeBubble();
            this.removeActiveClasses();
        });
        
        listen.mousedown(this.container, (e) => {
           e.preventDefault();
           e.stopPropagation();
           return false; 
        });
        
        listen.viewchanged(element, (e) => this.viewchanged(e.date, e.level, e.update));
        
        listen.openBubble(element, (e) => {
           this.openBubble(e.x, e.y, e.text); 
        });
        listen.updateBubble(element, (e) => {
           this.updateBubble(e.x, e.y, e.text); 
        });
        
        listen.swipeLeft(this.container, () => {
            if (this.secondPicker.isDragging() ||
                this.minutePicker.isDragging() ||
                this.hourPicker.isDragging()) return;
            this.header.next(); 
        });
        
        listen.swipeRight(this.container, () => {
            if (this.secondPicker.isDragging() ||
                this.minutePicker.isDragging() ||
                this.hourPicker.isDragging()) return;
            this.header.previous(); 
        });
        
        listen.blur(this.element, () => {
            this.closePicker();
        });
        
        listen.up(document, () => {
            this.closeBubble();
        });
        
        listen.updateDefinedState(element, (e) => {
            switch(e.level) {
                case Level.YEAR:
                    this.yearPicker.setDefined(e.defined);
                    break;
                case Level.MONTH:
                    this.monthPicker.setDefined(e.defined);
                    break;
                case Level.DATE:
                    this.datePicker.setDefined(e.defined);
                    break;
                case Level.HOUR:
                    this.hourPicker.setDefined(e.defined);
                    break;
                case Level.MINUTE:
                    this.minutePicker.setDefined(e.defined);
                    break;
                case Level.SECOND:
                    this.secondPicker.setDefined(e.defined);
                    break;
            }
        });
        
        listen.down(element, (e) => {
            if ((<TouchEvent>e).changedTouches !== void 0) {
                this.clientX = (<TouchEvent>e).changedTouches[0].clientX;
            } else {
                this.clientX = (<MouseEvent>e).clientX;
            }
        });
    }
    
    private clientX:number;
    
    private openingTimeout:number;
    
    public openPicker() {
        clearTimeout(this.openingTimeout);
        this.openingTimeout = setTimeout(() => {
            this.container.classList.remove('datium-closed');
            this.isOpen = true;
            this.adjustHeight(this.currentPicker.getHeight());
        }, 25);
    }
    
    private isOpen = false;
    
    public closePicker() {
        clearTimeout(this.openingTimeout);
        this.isOpen = false;
        this.container.classList.add('datium-closed');
        this.adjustHeight(0);
    }
    
    public closeBubble() {
        if (this.bubble === void 0) return;
        this.bubble.classList.remove('datium-bubble-visible');
        setTimeout((bubble:HTMLElement) => {
            bubble.parentNode.removeChild(bubble);
        }, this.options.transition ? 200 : 0, this.bubble);
        this.bubble = void 0;
    }
    
    private bubble:HTMLElement;
    
    public openBubble(x:number, y:number, text:string) {
        if (this.bubble !== void 0) {
            this.closeBubble();
        }
        this.bubble = document.createElement('datium-bubble');
        this.container.appendChild(this.bubble);
        this.updateBubble(x, y, text);
        setTimeout((bubble:HTMLElement) => {
           bubble.classList.add('datium-bubble-visible'); 
        }, 0, this.bubble);
    }
    
    public updateBubble(x:number, y:number, text:string) {
        this.bubble.innerHTML = text;
        this.bubble.style.top = y + 'px';
        this.bubble.style.left = x + 'px';
    }
    
    private viewchanged(date:Date, level:Level, update:boolean) {
        if (level === Level.NONE || this.element !== document.activeElement || !this.options.showPicker) {
            if (update) this.updateSelectedDate(date);
            this.closePicker();
            return;
        }
        
        let transition:Transition;
        if (this.currentPicker === void 0) {
            this.currentPicker = this.getPicker(level);
            this.currentPicker.create(date, Transition.ZOOM_IN);
        } else if ((transition = this.getTransition(date, level)) !== void 0) {
            this.currentPicker.remove(transition);
            this.currentPicker = this.getPicker(level);
            this.currentPicker.create(date, transition);
        }
        if (update) this.updateSelectedDate(date);
        if (this.isOpen) this.adjustHeight(this.currentPicker.getHeight());
        this.openPicker();
    }
    
    private date:Date;
    private updateSelectedDate(date:Date) {
        this.date = date;
        this.yearPicker.setSelectedDate(date);
        this.monthPicker.setSelectedDate(date);
        this.datePicker.setSelectedDate(date);
        this.hourPicker.setSelectedDate(date);
        this.minutePicker.setSelectedDate(date);
        this.secondPicker.setSelectedDate(date);
    }
    
    private getTransition(date:Date, level:Level):Transition {
        if (level > this.currentPicker.getLevel()) return Transition.ZOOM_IN;
        if (level < this.currentPicker.getLevel()) return Transition.ZOOM_OUT;
        if (date.valueOf() < this.currentPicker.getMin().valueOf()) return Transition.SLIDE_LEFT;
        if (date.valueOf() > this.currentPicker.getMax().valueOf()) return Transition.SLIDE_RIGHT;
        return void 0;
    }
    
    private adjustHeight(height:number) {
        
        let topSpace = this.element.getBoundingClientRect().top;
        let bottomSpace = window.innerHeight - this.element.getBoundingClientRect().bottom;
        
        let inputHeight = this.element.getBoundingClientRect().bottom - this.element.getBoundingClientRect().top;
        let marginTop = parseInt(getComputedStyle(this.element).getPropertyValue('margin-top'), 10);
        let marginBottom = parseInt(getComputedStyle(this.element).getPropertyValue('margin-bottom'), 10);
        let origin:number;
        let topAdjust:number;
        if (bottomSpace < 325 && topSpace > 325) {
            topAdjust = -inputHeight - 85 - marginTop;
            if (this.isOpen) {
                topAdjust -= height;
            }
            origin = 130;
        } else {
            topAdjust = -marginBottom;
            origin = 5;
        }
        
        let marginLeft = parseInt(getComputedStyle(this.element).getPropertyValue('margin-left'), 10);
        
        let scale = this.isOpen ? 'scale(1)' : 'scale(.01)';
        
        this.container.style.transform = `translate(${marginLeft}px, ${topAdjust}px) ${scale}`;
        
        let xDiff = this.clientX - this.container.getBoundingClientRect().left;
        if (xDiff < 10) xDiff = 10;
        if (xDiff > 220) xDiff = 220;
        this.container.style.transformOrigin = `${xDiff}px ${origin}px`;
        
        this.pickerContainer.style.transform = `translateY(${height - 280}px)`;
    }
    
    private getPicker(level:Level):IPicker {
        return [this.yearPicker,this.monthPicker,this.datePicker,this.hourPicker,this.minutePicker,this.secondPicker][level];
    }
    
    public removeActiveClasses() {
        let activeElements = this.container.querySelectorAll('.datium-active');
        for (let i = 0; i < activeElements.length; i++) {
            activeElements[i].classList.remove('datium-active');
        }
        this.container.classList.remove('datium-active');
    }
    
    private addActiveClasses(e:MouseEvent|TouchEvent) {
        let el = e.srcElement || <Element>e.target;
        while (el !== this.container) {
            el.classList.add('datium-active');
            el = el.parentElement;
        }
        this.container.classList.add('datium-active');
    }
    
    public updateOptions(options:IOptions) {
        this.header.updateMaxLevel(this.startLevel);
        
        let themeUpdated = this.options === void 0 ||
            this.options.theme === void 0 ||
            this.options.theme.primary !== options.theme.primary ||
            this.options.theme.primary_text !== options.theme.primary_text ||
            this.options.theme.secondary !== options.theme.secondary ||
            this.options.theme.secondary_accent !== options.theme.secondary_accent ||
            this.options.theme.secondary_text !== options.theme.secondary_text;
        
        this.options = options;
        
        if (themeUpdated) {
            this.insertStyles();
        }
        
        this.header.updateOptions(options);
        
        this.yearPicker.updateOptions(options);
        this.monthPicker.updateOptions(options);
        this.datePicker.updateOptions(options);
        this.hourPicker.updateOptions(options);
        this.minutePicker.updateOptions(options);
        this.secondPicker.updateOptions(options);
    }
    
    private createView():HTMLElement {
        let el = document.createElement('datium-container');
        el.innerHTML = header + `
        <datium-picker-container-wrapper>
            <datium-picker-container></datium-picker-container>
        </datium-picker-container-wrapper>`;
        el.classList.add('datium-closed');
        return el;
    }
    
    private insertAfter(node:Node, newNode:Node):void {
        node.parentNode.insertBefore(newNode, node.nextSibling);
    }
    
    static stylesInserted:number = 0;
    
    private insertStyles() {
        let head = document.head || document.getElementsByTagName('head')[0];
        let styleElement = document.createElement('style');
        
        let styleId = "datium-style" + (PickerManager.stylesInserted++);
        
        let existingStyleId = this.getExistingStyleId();
        if (existingStyleId !== null) {
            this.container.classList.remove(existingStyleId);
        }
        
        this.container.classList.add(styleId);
        
        let transformedCss = css.replace(/_primary_text_encoded/g, encodeURIComponent(this.options.theme.primary_text));
        transformedCss = transformedCss.replace(/_primary_text/g, this.options.theme.primary_text);
        transformedCss = transformedCss.replace(/_primary/g, this.options.theme.primary);
        transformedCss = transformedCss.replace(/_secondary_text/g, this.options.theme.secondary_text);
        transformedCss = transformedCss.replace(/_secondary_accent/g, this.options.theme.secondary_accent);
        transformedCss = transformedCss.replace(/_secondary/g, this.options.theme.secondary);
        transformedCss = transformedCss.replace(/_id/g, styleId);
        
        styleElement.type = 'text/css';
        if ((<any>styleElement).styleSheet){
            (<any>styleElement).styleSheet.cssText = transformedCss;
        } else {
            styleElement.appendChild(document.createTextNode(transformedCss));
        }

        head.appendChild(styleElement);  
    }
    
    private getExistingStyleId():string {
        for (let i = 0; i < this.container.classList.length; i++) {
            if (/^datium-style\d+$/.test(this.container.classList.item(i))) {
                return this.container.classList.item(i);
            }
        }
        return null;
    }
}
