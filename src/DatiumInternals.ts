const enum Level {
    YEAR, MONTH, DATE, HOUR,
    MINUTE, SECOND, NONE
}

class DatiumInternals {
    private options:IOptions = <any>{};
    
    private input:Input;
    private pickerManager:PickerManager;
    
    private levels:Level[];
    private date:Date;
    
    constructor(private element:HTMLInputElement, options:IOptions) {
        if (element === void 0) throw 'element is required';
        element.setAttribute('spellcheck', 'false');
        
        this.input = new Input(element);
        this.pickerManager = new PickerManager(element);
        
        this.updateOptions(options);
        
        listen.goto(element, (e) => this.goto(e.date, e.level, e.update));
        listen.zoomOut(element, (e) => this.zoomOut(e.date, e.currentLevel, e.update));
        listen.zoomIn(element, (e) => this.zoomIn(e.date, e.currentLevel, e.update));
        
        let initialDate = this.options['initialDate'];
        
        if (initialDate === void 0) {
            initialDate = new Date();
            if (initialDate.valueOf() < this.options['minDate'].valueOf()) {
                initialDate = new Date(this.options['minDate'].valueOf());
            }
            if (initialDate.valueOf() > this.options['maxDate'].valueOf()) {
                initialDate = new Date(this.options['maxDate'].valueOf());
            }
        } else {
            this.input.dateParts.forEach((datePart) => {
                datePart.setDefined(true);
            })
        }
        
        this.goto(initialDate, Level.NONE, true);
    }
    
    public setDate(date:Date) {
        // TODO implement this
    }
    
    public zoomOut(date:Date, currentLevel:Level, update:boolean = true) {
        let newLevel:Level = this.levels[this.levels.indexOf(currentLevel) - 1]; 
        if (newLevel === void 0) return;
        trigger.goto(this.element, {
           date: date,
           level: newLevel,
           update: update 
        });
    }
    
    public zoomIn(date:Date, currentLevel:Level, update:boolean = true) {
        let newLevel:Level = this.levels[this.levels.indexOf(currentLevel) + 1];
        
        if (newLevel === void 0) {
            newLevel = Level.NONE;
            this.pickerManager.closePicker();
        }
        
        this.input.dateParts.forEach((datePart) => {
            if (datePart.getLevel() <= currentLevel) {
                datePart.setDefined(true);
                trigger.updateDefinedState(this.element, {
                    defined: true,
                    level: datePart.getLevel()
                });
            } 
        });
        trigger.goto(this.element, {
           date: date,
           level: newLevel,
           update: update 
        });
    }
    
    public isValid() {
        return this.input.isValid();
    }
    
    public getDate() {
        return this.input.getDate();
    }
    
    public goto(date:Date, level:Level, update:boolean = true) {
        if (date === void 0 && update === false) {
            this.date = new Date();
            level = this.input.getLevels().slice().sort()[0];
        } else {
            this.date = date;
        }
        trigger.viewchanged(this.element, {
            date: this.date,
            level: level,
            update: update
        });
    }
    
    public updateOptions(newOptions:IOptions = <any>{}) {
        this.options = OptionSanitizer.sanitize(newOptions, this.options);        
        this.input.updateOptions(this.options);
        
        this.levels = this.input.getLevels().slice();
        this.levels.sort();
        
        if (this.pickerManager.currentPicker !== void 0) {
            let curLevel = this.pickerManager.currentPicker.getLevel();
            
            if (this.levels.indexOf(curLevel) == -1) {
                trigger.goto(this.element, {
                    date: this.date,
                    level: this.levels[0]
                })
            }
        }
        
        this.pickerManager.updateOptions(this.options);
    }
}