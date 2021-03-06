interface IPicker {
    getHeight():number;
    updateOptions(options:IOptions):void;
    getLevel():Level;
    create(date:Date, transition:Transition):void;
    remove(transition:Transition):void;
    getMin():Date;
    getMax():Date;
    setSelectedDate(date:Date):void;
    setDefined(defined:boolean):void;
}

interface ITimePicker extends IPicker {
    isDragging():boolean;
}