function NumToHex(hexNum, length)
{
    return "0x" + hexNum.toString(16).toUpperCase().padStart(length, "0");
}

//cpu.h
const MEMORY_SIZE                           = 4096;
 
const MEM_RAM_ADDR 		                    = 0x000;
const MEM_RAM_SIZE		                    = 0x280;
const MEM_DISPLAY1_ADDR	                    = 0xE00;
const MEM_DISPLAY1_SIZE	                    = 0x050;
const MEM_DISPLAY2_ADDR	                    = 0xE80;
const MEM_DISPLAY2_SIZE	                    = 0x050;
const MEM_IO_ADDR		                    = 0xF00;
const MEM_IO_SIZE		                    = 0x080;

/* Asign this value to true if you want to reduce the footprint of the memory buffer from 4096 u4_t (most likely bytes)
 * to 464 u8_t (bytes for sure), while increasing slightly the number of operations needed to read/write from/to it.
 */
const LOW_FOOTPRINT                         = true;

let MEM_BUFFER_SIZE;
let RAM_TO_MEMORY;
let DISP1_TO_MEMORY;
let DISP2_TO_MEMORY;
let IO_TO_MEMORY;
let SET_RAM_MEMORY;
let SET_DISP1_MEMORY;
let SET_DISP2_MEMORY;
let SET_IO_MEMORY;
let SET_MEMORY;
let GET_RAM_MEMORY;
let GET_DISP1_MEMORY;
let GET_DISP2_MEMORY;
let GET_IO_MEMORY;
let GET_MEMORY;

if (LOW_FOOTPRINT)
{
    /* Invalid memory areas are not buffered to reduce the footprint of the library in memory */
    MEM_BUFFER_SIZE                         = () => (MEM_RAM_SIZE + MEM_DISPLAY1_SIZE + MEM_DISPLAY2_SIZE + MEM_IO_SIZE)/2;


    /* Maps the CPU memory to the memory buffer */
    RAM_TO_MEMORY                           = (n) => (Math.floor((n - MEM_RAM_ADDR) / 2));
    DISP1_TO_MEMORY                         = (n) => (Math.floor((n - MEM_DISPLAY1_ADDR + MEM_RAM_SIZE)/2));
    DISP2_TO_MEMORY                         = (n) => (Math.floor((n - MEM_DISPLAY2_ADDR + MEM_RAM_SIZE + MEM_DISPLAY1_SIZE)/2));
    IO_TO_MEMORY                            = (n) => (Math.floor((n - MEM_IO_ADDR + MEM_RAM_SIZE + MEM_DISPLAY1_SIZE + MEM_DISPLAY2_SIZE)/2));

    SET_RAM_MEMORY                          = (buffer, n, v) =>{buffer[RAM_TO_MEMORY(n)] = (buffer[RAM_TO_MEMORY(n)] & ~(0xF << (((n) % 2) << 2))) | ((v) & 0xF) << (((n) % 2) << 2);};
    SET_DISP1_MEMORY                        = (buffer, n, v) =>{buffer[DISP1_TO_MEMORY(n)] = (buffer[DISP1_TO_MEMORY(n)] & ~(0xF << (((n) % 2) << 2))) | ((v) & 0xF) << (((n) % 2) << 2);};
    SET_DISP2_MEMORY                        = (buffer, n, v) =>{buffer[DISP2_TO_MEMORY(n)] = (buffer[DISP2_TO_MEMORY(n)] & ~(0xF << (((n) % 2) << 2))) | ((v) & 0xF) << (((n) % 2) << 2);};
    SET_IO_MEMORY                           = (buffer, n, v) =>{buffer[IO_TO_MEMORY(n)] = (buffer[IO_TO_MEMORY(n)] & ~(0xF << (((n) % 2) << 2))) | ((v) & 0xF) << (((n) % 2) << 2);};
    SET_MEMORY                              = (buffer, n, v) => {
                                                    if ((n) < (MEM_RAM_ADDR + MEM_RAM_SIZE)) {
                                                        SET_RAM_MEMORY(buffer, n, v);
                                                    } else if ((n) < MEM_DISPLAY1_ADDR) {
                                                        /* INVALID_MEMORY */ 
                                                    } else if ((n) < (MEM_DISPLAY1_ADDR + MEM_DISPLAY1_SIZE)) { 
                                                        SET_DISP1_MEMORY(buffer, n, v); 
                                                    } else if ((n) < MEM_DISPLAY2_ADDR) { 
                                                        /* INVALID_MEMORY */ 
                                                    } else if ((n) < (MEM_DISPLAY2_ADDR + MEM_DISPLAY2_SIZE)) { 
                                                        SET_DISP2_MEMORY(buffer, n, v); 
                                                    } else if ((n) < MEM_IO_ADDR) { 
                                                        /* INVALID_MEMORY */ 
                                                    } else if ((n) < (MEM_IO_ADDR + MEM_IO_SIZE)) { 
                                                        SET_IO_MEMORY(buffer, n, v); 
                                                    } else { 
                                                        /* INVALID_MEMORY */ 
                                                    }
                                            };

    GET_RAM_MEMORY                          = (buffer, n) =>((buffer[RAM_TO_MEMORY(n)] >> (((n) % 2) << 2)) & 0xF);
    GET_DISP1_MEMORY                        = (buffer, n) =>((buffer[DISP1_TO_MEMORY(n)] >> (((n) % 2) << 2)) & 0xF);
    GET_DISP2_MEMORY                        = (buffer, n) =>((buffer[DISP2_TO_MEMORY(n)] >> (((n) % 2) << 2)) & 0xF);
    GET_IO_MEMORY                           = (buffer, n) =>((buffer[IO_TO_MEMORY(n)] >> (((n) % 2) << 2)) & 0xF);
    GET_MEMORY                              = (buffer, n) => {
                                                    return ((buffer[
                                                    ((n) < (MEM_RAM_ADDR + MEM_RAM_SIZE)) ? RAM_TO_MEMORY(n) :
                                                    ((n) < MEM_DISPLAY1_ADDR) ? 0 :
                                                    ((n) < (MEM_DISPLAY1_ADDR + MEM_DISPLAY1_SIZE)) ? DISP1_TO_MEMORY(n) :
                                                    ((n) < MEM_DISPLAY2_ADDR) ? 0 :
                                                    ((n) < (MEM_DISPLAY2_ADDR + MEM_DISPLAY2_SIZE)) ? DISP2_TO_MEMORY(n) :
                                                    ((n) < MEM_IO_ADDR) ? 0 :
                                                    ((n) < (MEM_IO_ADDR + MEM_IO_SIZE)) ? IO_TO_MEMORY(n) : 0
                                                    ] >> (((n) % 2) << 2)) & 0xF)
                                            };

    //#define MEM_BUFFER_TYPE				u8_t
} else {
    MEM_BUFFER_SIZE                         = () => MEMORY_SIZE;
    
    SET_MEMORY                              = (buffer, n, v) => {buffer[n] = v;}
    SET_RAM_MEMORY                          = (buffer, n, v) => SET_MEMORY(buffer, n, v);
    SET_DISP1_MEMORY                        = (buffer, n, v) => SET_MEMORY(buffer, n, v);
    SET_DISP2_MEMORY                        = (buffer, n, v) => SET_MEMORY(buffer, n, v);
    SET_IO_MEMORY                           = (buffer, n, v) => SET_MEMORY(buffer, n, v);

    GET_MEMORY                              = (buffer, n) => (buffer[n]);
    GET_RAM_MEMORY                          = (buffer, n) => GET_MEMORY(buffer, n);
    GET_DISP1_MEMORY                        = (buffer, n) => GET_MEMORY(buffer, n);
    GET_DISP2_MEMORY                        = (buffer, n) => GET_MEMORY(buffer, n);
    GET_IO_MEMORY                           = (buffer, n) => GET_MEMORY(buffer, n);

    //#define MEM_BUFFER_TYPE				u4_t
}

class breakpoint_t {
    constructor(addr, next) {
        this.addr = addr;
        this.next = next;
    }
}

/* Pins (TODO: add other pins) */
const pin_t = {
    PIN_K00: 0x0,
    PIN_K01: 0x1,
    PIN_K02: 0x2,
    PIN_K03: 0x3,
    PIN_K10: 0x4,
    PIN_K11: 0x5,
    PIN_K12: 0x6,
    PIN_K13: 0x7,
};

const pin_state_t = {
    PIN_STATE_LOW: 0,
	PIN_STATE_HIGH: 1,
};

const int_slot_t = {
	INT_PROG_TIMER_SLOT: 0,
	INT_SERIAL_SLOT: 1,
	INT_K10_K13_SLOT: 2,
	INT_K00_K03_SLOT: 3,
	INT_STOPWATCH_SLOT: 4,
	INT_CLOCK_TIMER_SLOT: 5,
	INT_SLOT_NUM: 6, 
};

class interrupt_t {
    constructor(factor_flag_reg, mask_reg, triggered, vector) {
        this.factor_flag_reg = factor_flag_reg;
        this.mask_reg = mask_reg;
        this.triggered = triggered; /* 1 if triggered, 0 otherwise */
        this.vector = vector;
    }
}

class state_t {
    constructor() {
        this.pc = null;
        this.x = null;
        this.y = null;
        this.a = null;
        this.b = null;
        this.np = null;
        this.sp = null;
        this.flags = null;

        this.tick_counter = null;
        this.clk_timer_timestamp = null;
        this.prog_timer_timestamp = null;
        this.prog_timer_enabled = null;
        this.prog_timer_data = null;
        this.prog_timer_rld = null;

        this.call_depth = null;

        this.interrupts = null;

        this.memory = null;
    }
}

//cpu.c
const TICK_FREQUENCY                        = 32768; // Hz

const TIMER_1HZ_PERIOD                      = 32768; // in ticks
const TIMER_256HZ_PERIOD                    = 128; // in ticks

const MASK_4B                               = 0xF00;
const MASK_6B                               = 0xFC0;
const MASK_7B                               = 0xFE0;
const MASK_8B                               = 0xFF0;
const MASK_10B                              = 0xFFC;
const MASK_12B                              = 0xFFF;

const PCS                                   = () => (pc & 0xFF);
const PCSL                                  = () => (pc & 0xF);
const PCSH                                  = () => ((pc >> 4) & 0xF);
const PCP                                   = () => ((pc >> 8) & 0xF);
const PCB                                   = () => ((pc >> 12) & 0x1);
const TO_PC                                 = (bank, page, step)=> ((step & 0xFF) | ((page & 0xF) << 8) | (bank & 0x1) << 12);
const NBP                                   = () => ((np >> 4) & 0x1);
const NPP                                   = () => (np & 0xF);
const TO_NP                                 = (bank, page) => ((page & 0xF) | (bank & 0x1) << 4);
const XHL                                   = () => (x & 0xFF);
const XL                                    = () => (x & 0xF);
const XH                                    = () => ((x >> 4) & 0xF);
const XP                                    = () => ((x >> 8) & 0xF);
const YHL                                   = () => (y & 0xFF);
const YL                                    = () => (y & 0xF);
const YH                                    = () => ((y >> 4) & 0xF);
const YP                                    = () => ((y >> 8) & 0xF);
const M                                     = (n) => get_memory(n);
const SET_M                                 = (n, v) =>	set_memory(n, v);
const RQ                                    = (i) => get_rq(i);
const SET_RQ                                = (i, v) =>	set_rq(i, v);
const SPL                                   = () => (sp & 0xF);
const SPH                                   = () => ((sp >> 4) & 0xF);

const FLAG_C                                = (0x1 << 0);
const FLAG_Z                                = (0x1 << 1);
const FLAG_D                                = (0x1 << 2);
const FLAG_I                                = (0x1 << 3);

const C                                     = () => !!(flags & FLAG_C);
const Z                                     = () => !!(flags & FLAG_Z);
const D                                     = () => !!(flags & FLAG_D);
const I                                     = () => !!(flags & FLAG_I);

function SET_C()                            {flags |= FLAG_C;}
function CLEAR_C()                          {flags &= ~FLAG_C;}
function SET_Z()                            {flags |= FLAG_Z;}
function CLEAR_Z()                          {flags &= ~FLAG_Z;}
function SET_D()                            {flags |= FLAG_D;}
function CLEAR_D()                          {flags &= ~FLAG_D;}
function SET_I()                            {flags |= FLAG_I;}
function CLEAR_I()                          {flags &= ~FLAG_I;}

const REG_CLK_INT_FACTOR_FLAGS              = 0xF00;
const REG_SW_INT_FACTOR_FLAGS               = 0xF01;
const REG_PROG_INT_FACTOR_FLAGS             = 0xF02;
const REG_SERIAL_INT_FACTOR_FLAGS	        = 0xF03;
const REG_K00_K03_INT_FACTOR_FLAGS          = 0xF04;
const REG_K10_K13_INT_FACTOR_FLAGS          = 0xF05;
const REG_CLOCK_INT_MASKS                   = 0xF10;
const REG_SW_INT_MASKS                      = 0xF11;
const REG_PROG_INT_MASKS                    = 0xF12;
const REG_SERIAL_INT_MASKS                  = 0xF13;
const REG_K00_K03_INT_MASKS                 = 0xF14;
const REG_K10_K13_INT_MASKS                 = 0xF15;
const REG_PROG_TIMER_DATA_L                 = 0xF24;
const REG_PROG_TIMER_DATA_H                 = 0xF25;
const REG_PROG_TIMER_RELOAD_DATA_L          = 0xF26;
const REG_PROG_TIMER_RELOAD_DATA_H          = 0xF27;
const REG_K00_K03_INPUT_PORT                = 0xF40;
const REG_K10_K13_INPUT_PORT                = 0xF42;
const REG_K40_K43_BZ_OUTPUT_PORT            = 0xF54;
const REG_CPU_OSC3_CTRL                     = 0xF70;
const REG_LCD_CTRL                          = 0xF71;
const REG_LCD_CONTRAST                      = 0xF72;
const REG_SVD_CTRL                          = 0xF73;
const REG_BUZZER_CTRL1                      = 0xF74;
const REG_BUZZER_CTRL2                      = 0xF75;
const REG_CLK_WD_TIMER_CTRL                 = 0xF76;
const REG_SW_TIMER_CTRL                     = 0xF77;
const REG_PROG_TIMER_CTRL                   = 0xF78;
const REG_PROG_TIMER_CLK_SEL                = 0xF79;

const INPUT_PORT_NUM                        = 2;

class op_t {
    constructor(log, code, mask, shift_arg0, mask_arg0, cycles, cb) {
        this.log = log;
        this.code = code;
        this.mask = mask;
        this.shift_arg0 = shift_arg0;
        this.mask_arg0 = mask_arg0;         // != 0 only if there are two arguments
        this.cycles = cycles;
        this.cb = cb;
    }
}

class input_port_t {
  constructor() {
    this.states = 0;
  }
}

/* Registers */
let pc                                      = 0;
let next_pc                                 = 0;
let x                                       = 0;
let y                                       = 0;
let a                                       = 0;
let b                                       = 0;
let np                                      = 0;
let sp                                      = 0;

/* Flags */
let flags                                   = 0;

let g_program                               = NULL;
let memory                                  = new Array(MEM_BUFFER_SIZE());//Uint8Array(MEM_BUFFER_SIZE());

//let inputs                                  = new Array(INPUT_PORT_NUM).fill(0);
let inputs = [];
for (let i = 0; i < INPUT_PORT_NUM; i++) {
    inputs.push(new input_port_t());
}

/* Interrupts (in priority order) */
let interrupts = [
    new interrupt_t(0x0, 0x0, 0, 0x0C), // Prog timer
    new interrupt_t(0x0, 0x0, 0, 0x0A), // Serial interface
    new interrupt_t(0x0, 0x0, 0, 0x08), // Input (K10-K13)
    new interrupt_t(0x0, 0x0, 0, 0x06), // Input (K00-K03)
    new interrupt_t(0x0, 0x0, 0, 0x04), // Stopwatch timer
    new interrupt_t(0x0, 0x0, 0, 0x02)  // Clock timer
];

let g_breakpoints                           = NULL;

let call_depth                              = 0;

let clk_timer_timestamp                     = 0; // in ticks
let prog_timer_timestamp                    = 0; // in ticks
let prog_timer_enabled                      = 0;
let prog_timer_data                         = 0;
let prog_timer_rld                          = 0;

let tick_counter                            = 0;
let ts_freq;
let speed_ratio                             = 1;
let ref_ts;

let cpu_state = new state_t();

function cpu_add_bp(list, addr) {
    //TODO: Not implemented
}

function cpu_free_bp(list) {
    //TODO: Not implemented
}

function cpu_set_speed(speed) {
    speed_ratio = speed;
}

function cpu_get_state() {
    cpu_state.pc = pc;
    cpu_state.x = x;
    cpu_state.y = y;
    cpu_state.a = a;
    cpu_state.b = b;
    cpu_state.np = np;
    cpu_state.sp = sp;
    cpu_state.flags = flags;

    cpu_state.tick_counter = tick_counter;
    cpu_state.clk_timer_timestamp = clk_timer_timestamp;
    cpu_state.prog_timer_timestamp = prog_timer_timestamp;
    cpu_state.prog_timer_enabled = prog_timer_enabled;
    cpu_state.prog_timer_data = prog_timer_data;
    cpu_state.prog_timer_rld = prog_timer_rld;
    
    cpu_state.call_depth = call_depth;

    cpu_state.interrupts = interrupts;

    cpu_state.memory = memory;
    return cpu_state;
}

function cpu_set_state(state) {
    pc = state.pc;
    x = state.x;
    y = state.y;
    a = state.a;
    b = state.b;
    np = state.np;
    sp = state.sp;
    flags = state.flags;
    
    tick_counter = state.tick_counter;
    clk_timer_timestamp = state.clk_timer_timestamp;
    prog_timer_timestamp = state.prog_timer_timestamp;
    prog_timer_enabled = state.prog_timer_enabled;
    prog_timer_data = state.prog_timer_data;
    prog_timer_rld = state.prog_timer_rld;
    
    call_depth = state.call_depth;
    
    interrupts = state.interrupts;
    
    memory = state.memory;

	// helps button reset properly after loading state
	hw_set_button(button_t.BTN_LEFT, btn_state_t.BTN_STATE_RELEASED);
	hw_set_button(button_t.BTN_MIDDLE, btn_state_t.BTN_STATE_RELEASED);
	hw_set_button(button_t.BTN_RIGHT, btn_state_t.BTN_STATE_RELEASED);
}

function cpu_get_depth() {
    return call_depth;
}

function generate_interrupt(slot, bit) {
    /* Set the factor flag no matter what */
    interrupts[slot].factor_flag_reg = interrupts[slot].factor_flag_reg | (0x1 << bit);

    /* Trigger the INT only if not masked */
    if (interrupts[slot].mask_reg & (0x1 << bit)) {
        interrupts[slot].triggered = 1;
    }
}

function cpu_set_input_pin(pin, state) {
    /* Set the I/O */
    inputs[pin & 0x4].states = (inputs[pin & 0x4].states & ~(0x1 << (pin & 0x3))) | (state << (pin & 0x3));

    /* Trigger the interrupt (TODO: handle relation register) */
    if (state == pin_state_t.PIN_STATE_LOW) {
        switch ((pin & 0x4) >> 2) {
            case 0:
                generate_interrupt(int_slot_t.INT_K00_K03_SLOT, pin & 0x3);
                break;

            case 1:
                generate_interrupt(int_slot_t.INT_K10_K13_SLOT, pin & 0x3);
                break;
        }
    }
}

function cpu_sync_ref_timestamp() {
    ref_ts = g_hal.get_timestamp();
}

function get_io(n) {
	let tmp;

	switch (n) {
		case REG_CLK_INT_FACTOR_FLAGS:
			/* Interrupt factor flags (clock timer) */
			tmp = interrupts[int_slot_t.INT_CLOCK_TIMER_SLOT].factor_flag_reg;
			interrupts[int_slot_t.INT_CLOCK_TIMER_SLOT].factor_flag_reg = 0;
			return tmp;

		case REG_SW_INT_FACTOR_FLAGS:
			/* Interrupt factor flags (stopwatch) */
			tmp = interrupts[int_slot_t.INT_STOPWATCH_SLOT].factor_flag_reg;
			interrupts[int_slot_t.INT_STOPWATCH_SLOT].factor_flag_reg = 0;
			return tmp;

		case REG_PROG_INT_FACTOR_FLAGS:
			/* Interrupt factor flags (prog timer) */
			tmp = interrupts[int_slot_t.INT_PROG_TIMER_SLOT].factor_flag_reg;
			interrupts[int_slot_t.INT_PROG_TIMER_SLOT].factor_flag_reg = 0;
			return tmp;

		case REG_SERIAL_INT_FACTOR_FLAGS:
			/* Interrupt factor flags (serial) */
			tmp = interrupts[int_slot_t.INT_SERIAL_SLOT].factor_flag_reg;
			interrupts[int_slot_t.INT_SERIAL_SLOT].factor_flag_reg = 0;
			return tmp;

		case REG_K00_K03_INT_FACTOR_FLAGS:
			/* Interrupt factor flags (K00-K03) */
			tmp = interrupts[int_slot_t.INT_K00_K03_SLOT].factor_flag_reg;
			interrupts[int_slot_t.INT_K00_K03_SLOT].factor_flag_reg = 0;
			return tmp;

		case REG_K10_K13_INT_FACTOR_FLAGS:
			/* Interrupt factor flags (K10-K13) */
			tmp = interrupts[int_slot_t.INT_K10_K13_SLOT].factor_flag_reg;
			interrupts[int_slot_t.INT_K10_K13_SLOT].factor_flag_reg = 0;
			return tmp;

		case REG_CLOCK_INT_MASKS:
			/* Clock timer interrupt masks */
			return interrupts[int_slot_t.INT_CLOCK_TIMER_SLOT].mask_reg;

		case REG_SW_INT_MASKS:
			/* Stopwatch interrupt masks */
			return interrupts[int_slot_t.INT_STOPWATCH_SLOT].mask_reg & 0x3;

		case REG_PROG_INT_MASKS:
			/* Prog timer interrupt masks */
			return interrupts[int_slot_t.INT_PROG_TIMER_SLOT].mask_reg & 0x1;

		case REG_SERIAL_INT_MASKS:
			/* Serial interface interrupt masks */
			return interrupts[int_slot_t.INT_SERIAL_SLOT].mask_reg & 0x1;

		case REG_K00_K03_INT_MASKS:
			/* Input (K00-K03) interrupt masks */
			return interrupts[int_slot_t.INT_K00_K03_SLOT].mask_reg;

		case REG_K10_K13_INT_MASKS:
			/* Input (K10-K13) interrupt masks */
			return interrupts[int_slot_t.INT_K10_K13_SLOT].mask_reg;

		case REG_PROG_TIMER_DATA_L:
			/* Prog timer data (low) */
			return prog_timer_data & 0xF;

		case REG_PROG_TIMER_DATA_H:
			/* Prog timer data (high) */
			return (prog_timer_data >> 4) & 0xF;

		case REG_PROG_TIMER_RELOAD_DATA_L:
			/* Prog timer reload data (low) */
			return prog_timer_rld & 0xF;

		case REG_PROG_TIMER_RELOAD_DATA_H:
			/* Prog timer reload data (high) */
			return (prog_timer_rld >> 4) & 0xF;

		case REG_K00_K03_INPUT_PORT:
			/* Input port (K00-K03) */
			return inputs[0].states;

		case REG_K10_K13_INPUT_PORT:
			/* Input port (K10-K13) */
			return inputs[1].states;

		case REG_K40_K43_BZ_OUTPUT_PORT:
			/* Output port (R40-R43) */
			return GET_IO_MEMORY(memory, n);

		case REG_CPU_OSC3_CTRL:
			/* CPU/OSC3 clocks switch, CPU voltage switch */
			return GET_IO_MEMORY(memory, n);

		case REG_LCD_CTRL:
			/* LCD control */
			return GET_IO_MEMORY(memory, n);

		case REG_LCD_CONTRAST:
			/* LCD contrast */
			break;

		case REG_SVD_CTRL:
			/* SVD */
			return GET_IO_MEMORY(memory, n) & 0x7; // Voltage always OK

		case REG_BUZZER_CTRL1:
			/* Buzzer config 1 */
			return GET_IO_MEMORY(memory, n);

		case REG_BUZZER_CTRL2:
			/* Buzzer config 2 */
			return GET_IO_MEMORY(memory, n) & 0x3; // Buzzer ready

		case REG_CLK_WD_TIMER_CTRL:
			/* Clock/Watchdog timer reset */
			break;

		case REG_SW_TIMER_CTRL:
			/* Stopwatch stop/run/reset */
			break;

		case REG_PROG_TIMER_CTRL:
			/* Prog timer stop/run/reset */
			return !!prog_timer_enabled;

		case REG_PROG_TIMER_CLK_SEL:
			/* Prog timer clock selection */
			break;

		default:
            g_hal.log(log_level_t.LOG_ERROR, "Read from unimplemented I/O " + NumToHex(n, 3) + " - PC = " + NumToHex(pc, 4) + "\n");
            //g_hal.log(log_level_t.LOG_ERROR, "Read from unimplemented I/O 0x%03X - PC = 0x%04X\n", n, pc);
	}

	return 0;
}

function set_io(n, v) {
	switch (n) {
		case REG_CLOCK_INT_MASKS:
			/* Clock timer interrupt masks */
			/* Assume 1Hz timer INT enabled (0x8) */
			interrupts[int_slot_t.INT_CLOCK_TIMER_SLOT].mask_reg = v;
			break;

		case REG_SW_INT_MASKS:
			/* Stopwatch interrupt masks */
			/* Assume all INT disabled */
			interrupts[int_slot_t.INT_STOPWATCH_SLOT].mask_reg = v;
			break;

		case REG_PROG_INT_MASKS:
			/* Prog timer interrupt masks */
			/* Assume Prog timer INT enabled (0x1) */
			interrupts[int_slot_t.INT_PROG_TIMER_SLOT].mask_reg = v;
			break;

		case REG_SERIAL_INT_MASKS:
			/* Serial interface interrupt masks */
			/* Assume all INT disabled */
			interrupts[int_slot_t.INT_K10_K13_SLOT].mask_reg = v;
			break;

		case REG_K00_K03_INT_MASKS:
			/* Input (K00-K03) interrupt masks */
			/* Assume all INT disabled */
			interrupts[int_slot_t.INT_SERIAL_SLOT].mask_reg = v;
			break;

		case REG_K10_K13_INT_MASKS:
			/* Input (K10-K13) interrupt masks */
			/* Assume all INT disabled */
			interrupts[int_slot_t.INT_K10_K13_SLOT].mask_reg = v;
			break;

		case REG_PROG_TIMER_RELOAD_DATA_L:
			/* Prog timer reload data (low) */
			prog_timer_rld = v | (prog_timer_rld & 0xF0);
			break;

		case REG_PROG_TIMER_RELOAD_DATA_H:
			/* Prog timer reload data (high) */
			prog_timer_rld = (prog_timer_rld & 0xF) | (v << 4);
			break;

		case REG_K00_K03_INPUT_PORT:
			/* Input port (K00-K03) */
			/* Write not allowed */
			break;

		case REG_K40_K43_BZ_OUTPUT_PORT:
			/* Output port (R40-R43) */
			//g_hal->log(LOG_INFO, "Output/Buzzer: 0x%X\n", v);
			hw_enable_buzzer(!(v & 0x8));
			break;

		case REG_CPU_OSC3_CTRL:
			/* CPU/OSC3 clocks switch, CPU voltage switch */
			/* Assume 32,768 OSC1 selected, OSC3 off, battery >= 3,1V (0x1) */
			break;

		case REG_LCD_CTRL:
			/* LCD control */
			break;

		case REG_LCD_CONTRAST:
			/* LCD contrast */
			/* Assume medium contrast (0x8) */
			break;

		case REG_SVD_CTRL:
			/* SVD */
			/* Assume battery voltage always OK (0x6) */
			break;

		case REG_BUZZER_CTRL1:
			/* Buzzer config 1 */
			hw_set_buzzer_freq(v & 0x7);
			break;

		case REG_BUZZER_CTRL2:
			/* Buzzer config 2 */
			break;

		case REG_CLK_WD_TIMER_CTRL:
			/* Clock/Watchdog timer reset */
			/* Ignore watchdog */
			break;

		case REG_SW_TIMER_CTRL:
			/* Stopwatch stop/run/reset */
			break;

		case REG_PROG_TIMER_CTRL:
			/* Prog timer stop/run/reset */
			if (v & 0x2) {
				prog_timer_data = prog_timer_rld;
			}

			if ((v & 0x1) && !prog_timer_enabled) {
				prog_timer_timestamp = tick_counter;
			}

			prog_timer_enabled = v & 0x1;
			break;

		case REG_PROG_TIMER_CLK_SEL:
			/* Prog timer clock selection */
			/* Assume 256Hz, output disabled */
			break;

		default:
            g_hal.log(log_level_t.LOG_ERROR, "Write " + NumToHex(v, 0) + " to unimplemented I/O " + NumToHex(n, 3) + " - PC = " + NumToHex(pc, 4) + "\n");
            //g_hal.log(log_level_t.LOG_ERROR, "Write 0x%X to unimplemented I/O 0x%03X - PC = 0x%04X\n", v, n, pc);
	}
}

function set_lcd(n, v) {
    let i;
    let seg;
    let com0;
    
    seg = ((n & 0x7F) >> 1);
    com0 = (((n & 0x80) >> 7) * 8 + (n & 0x1) * 4);

    for (i = 0; i < 4; i++) {
        hw_set_lcd_pin(seg, com0 + i, (v >> i) & 0x1);
    }
}

function get_memory(n) {
    //console.log("n: " + n);
    //console.log("mem io addr: " + MEM_IO_ADDR);
	let res = 0;
    
    if (n < MEM_RAM_SIZE) {
		/* RAM */
        g_hal.log(log_level_t.LOG_MEMORY, "RAM              - ");
		res = GET_RAM_MEMORY(memory, n);
	} else if (n >= MEM_DISPLAY1_ADDR && n < (MEM_DISPLAY1_ADDR + MEM_DISPLAY1_SIZE)) {
		/* Display Memory 1 */
		g_hal.log(log_level_t.LOG_MEMORY, "Display Memory 1 - ");
		res = GET_DISP1_MEMORY(memory, n);
	} else if (n >= MEM_DISPLAY2_ADDR && n < (MEM_DISPLAY2_ADDR + MEM_DISPLAY2_SIZE)) {
		/* Display Memory 2 */
		g_hal.log(log_level_t.LOG_MEMORY, "Display Memory 2 - ");
		res = GET_DISP2_MEMORY(memory, n);
	} else if (n >= MEM_IO_ADDR && n < (MEM_IO_ADDR + MEM_IO_SIZE)) {
		/* I/O Memory */
		g_hal.log(log_level_t.LOG_MEMORY, "I/O              - ");
        //console.log("getting io");
		res = get_io(n);
	} else {
        g_hal.log(log_level_t.LOG_ERROR, "Read from invalid memory address " + NumToHex(n, 3) + " - PC = " + NumToHex(pc, 4) + "\n");
		//g_hal.log(log_level_t.LOG_ERROR, "Read from invalid memory address 0x%03X - PC = 0x%04X\n", n, pc);
		return 0;
	}

    g_hal.log(log_level_t.LOG_MEMORY, "Read  " + NumToHex(res, 0) + " - Address " + NumToHex(n, 3) + " - PC = " + NumToHex(pc, 4) + "\n");
	//g_hal.log(log_level_t.LOG_MEMORY, "Read  0x%X - Address 0x%03X - PC = 0x%04X\n", res, n, pc);

	return res;
}

function set_memory(n, v)
{
    //console.log("n: " + n);
	/* Cache any data written to a valid address, and process it */
	if (n < MEM_RAM_SIZE) {
		/* RAM */
		SET_RAM_MEMORY(memory, n, v);
		g_hal.log(log_level_t.LOG_MEMORY, "RAM              - ");
	} else if (n >= MEM_DISPLAY1_ADDR && n < (MEM_DISPLAY1_ADDR + MEM_DISPLAY1_SIZE)) {
		/* Display Memory 1 */
		SET_DISP1_MEMORY(memory, n, v);
		set_lcd(n, v);
		g_hal.log(log_level_t.LOG_MEMORY, "Display Memory 1 - ");
	} else if (n >= MEM_DISPLAY2_ADDR && n < (MEM_DISPLAY2_ADDR + MEM_DISPLAY2_SIZE)) {
		/* Display Memory 2 */
		SET_DISP2_MEMORY(memory, n, v);
		set_lcd(n, v);
		g_hal.log(log_level_t.LOG_MEMORY, "Display Memory 2 - ");
	} else if (n >= MEM_IO_ADDR && n < (MEM_IO_ADDR + MEM_IO_SIZE)) {
		/* I/O Memory */
        //console.log("setting io");
        //console.trace();
		SET_IO_MEMORY(memory, n, v);
		set_io(n, v);
		g_hal.log(log_level_t.LOG_MEMORY, "I/O              - ");
	} else {
		g_hal.log(log_level_t.LOG_ERROR, "Write " + NumToHex(v, 0) + " to invalid memory address " + NumToHex(n, 3) + " - PC = " + NumToHex(pc, 4) + "\n");
        //g_hal.log(log_level_t.LOG_ERROR, "Write 0x%X to invalid memory address 0x%03X - PC = 0x%04X\n", v, n, pc);
		return;
	}
    g_hal.log(log_level_t.LOG_MEMORY, "Write " + NumToHex(v, 0) + " - Address " + NumToHex(n, 3) + " - PC = " + NumToHex(pc, 4) + "\n");
	//g_hal.log(log_level_t.LOG_MEMORY, "Write 0x%X - Address 0x%03X - PC = 0x%04X\n", v, n, pc);
}

function cpu_refresh_hw() {
    const refresh_locs = [
        { addr: MEM_DISPLAY1_ADDR, size: MEM_DISPLAY1_SIZE },   // Display Memory 1
        { addr: MEM_DISPLAY2_ADDR, size: MEM_DISPLAY2_SIZE },   // Display Memory 2
        { addr: REG_BUZZER_CTRL1, size: 1 },                    // Buzzer frequency
        { addr: REG_K40_K43_BZ_OUTPUT_PORT, size: 1 },          // Buzzer enabled
        { addr: 0, size: 0 },                                   // end of list
    ];

    for (let i = 0; refresh_locs[i].size != 0; i++) {
        for (let n = refresh_locs[i].addr; n < (refresh_locs[i].addr + refresh_locs[i].size); n++) {
            set_memory(n, GET_MEMORY(memory, n));
        }
    }
}

function get_rq(rq) {
	switch (rq & 0x3) {
		case 0x0:
			return a;

		case 0x1:
			return b;

		case 0x2:
			return M(x);

		case 0x3:
			return M(y);
	}

	return 0;
}

function set_rq(rq, v)
{
	switch (rq & 0x3) {
		case 0x0:
			a = v;
			break;

		case 0x1:
			b = v;
			break;

		case 0x2:
			SET_M(x, v);
			break;

		case 0x3:
			SET_M(y, v);
			break;
	}
}

/* Instructions */
function op_pset_cb(arg0, arg1) {
	np = arg0;
}

function op_jp_cb(arg0, arg1) {
	next_pc = arg0 | (np << 8);
}

function op_jp_c_cb(arg0, arg1) {
	if (flags & FLAG_C) {
		next_pc = arg0 | (np << 8);
	}
}

function op_jp_nc_cb(arg0, arg1) {
	if (!(flags & FLAG_C)) {
		next_pc = arg0 | (np << 8);
	}
}

function op_jp_z_cb(arg0, arg1) {
	if (flags & FLAG_Z) {
		next_pc = arg0 | (np << 8);
	}
}

function op_jp_nz_cb(arg0, arg1) {
	if (!(flags & FLAG_Z)) {
		next_pc = arg0 | (np << 8);
	}
}

function op_jpba_cb(arg0, arg1) {
	next_pc = a | (b << 4) | (np << 8);
}

function op_call_cb(arg0, arg1) {
	pc = (pc + 1) & 0x1FFF; // This does not actually change the PC register
	SET_M(sp - 1, PCP());
	SET_M(sp - 2, PCSH());
	SET_M(sp - 3, PCSL());
	sp = (sp - 3) & 0xFF;
	next_pc = TO_PC(PCB(), NPP(), arg0);
	call_depth++;
}

function op_calz_cb(arg0, arg1) {
	pc = (pc + 1) & 0x1FFF; // This does not actually change the PC register
	SET_M(sp - 1, PCP());
	SET_M(sp - 2, PCSH());
	SET_M(sp - 3, PCSL());
	sp = (sp - 3) & 0xFF;
	next_pc = TO_PC(PCB(), 0, arg0);
	call_depth++;
}

function op_ret_cb(arg0, arg1) {
	next_pc = M(sp) | (M(sp + 1) << 4) | (M(sp + 2) << 8) | (PCB() << 12);
	sp = (sp + 3) & 0xFF;
	call_depth--;
}

function op_rets_cb(arg0, arg1) {
	next_pc = M(sp) | (M(sp + 1) << 4) | (M(sp + 2) << 8) | (PCB() << 12);
	sp = (sp + 3) & 0xFF;
	next_pc = (pc + 1) & 0x1FFF;
	call_depth--;
}

function op_retd_cb(arg0, arg1) {
	next_pc = M(sp) | (M(sp + 1) << 4) | (M(sp + 2) << 8) | (PCB() << 12);
	sp = (sp + 3) & 0xFF;
	SET_M(x, arg0 & 0xF);
	SET_M(x + 1, (arg0 >> 4) & 0xF);
	x = ((x + 2) & 0xFF) | (XP() << 8);
	call_depth--;
}

function op_nop5_cb(arg0, arg1) {
}

function op_nop7_cb(arg0, arg1) {
}

function op_halt_cb(arg0, arg1) {
    g_hal.halt();
}

function op_inc_x_cb(arg0, arg1) {
	x = ((x + 1) & 0xFF) | (XP() << 8);
}

function op_inc_y_cb(arg0, arg1) {
	y = ((y + 1) & 0xFF) | (YP() << 8);
}

function op_ld_x_cb(arg0, arg1) {
	x = arg0 | (XP() << 8);
}

function op_ld_y_cb(arg0, arg1) {
	y = arg0 | (YP() << 8);
}

function op_ld_xp_r_cb(arg0, arg1) {
	x = XHL() | (RQ(arg0) << 8);
}

function op_ld_xh_r_cb(arg0, arg1) {
	x = XL() | (RQ(arg0) << 4) | (XP() << 8);
}

function op_ld_xl_r_cb(arg0, arg1) {
	x = RQ(arg0) | (XH() << 4) | (XP() << 8);
}

function op_ld_yp_r_cb(arg0, arg1) {
	y = YHL() | (RQ(arg0) << 8);
}

function op_ld_yh_r_cb(arg0, arg1) {
	y = YL() | (RQ(arg0) << 4) | (YP() << 8);
}

function op_ld_yl_r_cb(arg0, arg1) {
	y = RQ(arg0) | (YH() << 4) | (YP() << 8);
}

function op_ld_r_xp_cb(arg0, arg1) {
	SET_RQ(arg0, XP());
}

function op_ld_r_xh_cb(arg0, arg1) {
	SET_RQ(arg0, XH());
}

function op_ld_r_xl_cb(arg0, arg1) {
	SET_RQ(arg0, XL());
}

function op_ld_r_yp_cb(arg0, arg1) {
	SET_RQ(arg0, YP());
}

function op_ld_r_yh_cb(arg0, arg1) {
	SET_RQ(arg0, YH());
}

function op_ld_r_yl_cb(arg0, arg1) {
	SET_RQ(arg0, YL());
}

function op_adc_xh_cb(arg0, arg1) {
	let tmp;

	tmp = XH() + arg0 + C();
	x = XL() | ((tmp & 0xF) << 4)| (XP() << 8);
	if (tmp >> 4) { SET_C(); } else { CLEAR_C(); }
	if (!(tmp & 0xF)) { SET_Z(); } else { CLEAR_Z(); }
}

function op_adc_xl_cb(arg0, arg1) {
	let tmp;

	tmp = XL() + arg0 + C();
	x = (tmp & 0xF) | (XH() << 4) | (XP() << 8);
	if (tmp >> 4) { SET_C(); } else { CLEAR_C(); }
	if (!(tmp & 0xF)) { SET_Z(); } else { CLEAR_Z(); }
}

function op_adc_yh_cb(arg0, arg1) {
	let tmp;

	tmp = YH() + arg0 + C();
	y = YL() | ((tmp & 0xF) << 4)| (YP() << 8);
	if (tmp >> 4) { SET_C(); } else { CLEAR_C(); }
	if (!(tmp & 0xF)) { SET_Z(); } else { CLEAR_Z(); }
}

function op_adc_yl_cb(arg0, arg1) {
	let tmp;

	tmp = YL() + arg0 + C();
	y = (tmp & 0xF) | (YH() << 4) | (YP() << 8);
	if (tmp >> 4) { SET_C(); } else { CLEAR_C(); }
	if (!(tmp & 0xF)) { SET_Z(); } else { CLEAR_Z(); }
}

function op_cp_xh_cb(arg0, arg1) {
	if (XH() < arg0) { SET_C(); } else { CLEAR_C(); }
	if (XH() == arg0) { SET_Z(); } else { CLEAR_Z(); }
}

function op_cp_xl_cb(arg0, arg1) {
	if (XL() < arg0) { SET_C(); } else { CLEAR_C(); }
	if (XL() == arg0) { SET_Z(); } else { CLEAR_Z(); }
}

function op_cp_yh_cb(arg0, arg1) {
	if (YH() < arg0) { SET_C(); } else { CLEAR_C(); }
	if (YH() == arg0) { SET_Z(); } else { CLEAR_Z(); }
}

function op_cp_yl_cb(arg0, arg1) {
	if (YL() < arg0) { SET_C(); } else { CLEAR_C(); }
	if (YL() == arg0) { SET_Z(); } else { CLEAR_Z(); }
}

function op_ld_r_i_cb(arg0, arg1) {
	SET_RQ(arg0, arg1);
}

function op_ld_r_q_cb(arg0, arg1) {
	SET_RQ(arg0, RQ(arg1));
}

function op_ld_a_mn_cb(arg0, arg1) {
	a = M(arg0);
}

function op_ld_b_mn_cb(arg0, arg1) {
	b = M(arg0);
}

function op_ld_mn_a_cb(arg0, arg1) {
	SET_M(arg0, a);
}

function op_ld_mn_b_cb(arg0, arg1) {
	SET_M(arg0, b);
}

function op_ldpx_mx_cb(arg0, arg1) {
	SET_M(x, arg0);
	x = ((x + 1) & 0xFF) | (XP() << 8);
}

function op_ldpx_r_cb(arg0, arg1) {
	SET_RQ(arg0, RQ(arg1));
	x = ((x + 1) & 0xFF) | (XP() << 8);
}

function op_ldpy_my_cb(arg0, arg1) {
	SET_M(y, arg0);
	y = ((y + 1) & 0xFF) | (YP() << 8);
}

function op_ldpy_r_cb(arg0, arg1) {
	SET_RQ(arg0, RQ(arg1));
	y = ((y + 1) & 0xFF) | (YP() << 8);
}

function op_lbpx_cb(arg0, arg1) {
	SET_M(x, arg0 & 0xF);
	SET_M(x + 1, (arg0 >> 4) & 0xF);
	x = ((x + 2) & 0xFF) | (XP() << 8);
}

function op_set_cb(arg0, arg1) {
	flags |= arg0;
}

function op_rst_cb(arg0, arg1) {
	flags &= arg0;
}

function op_scf_cb(arg0, arg1) {
	SET_C();
}

function op_rcf_cb(arg0, arg1) {
	CLEAR_C();
}

function op_szf_cb(arg0, arg1) {
	SET_Z();
}

function op_rzf_cb(arg0, arg1) {
	CLEAR_Z();
}

function op_sdf_cb(arg0, arg1) {
	SET_D();
}

function op_rdf_cb(arg0, arg1) {
	CLEAR_D();
}

function op_ei_cb(arg0, arg1) {
	SET_I();
}

function op_di_cb(arg0, arg1) {
	CLEAR_I();
}

function op_inc_sp_cb(arg0, arg1) {
	sp = (sp + 1) & 0xFF;
}

function op_dec_sp_cb(arg0, arg1) {
	sp = (sp - 1) & 0xFF;
}

function op_push_r_cb(arg0, arg1) {
	sp = (sp - 1) & 0xFF;
	SET_M(sp, RQ(arg0));
}

function op_push_xp_cb(arg0, arg1) {
	sp = (sp - 1) & 0xFF;
	SET_M(sp, XP());
}

function op_push_xh_cb(arg0, arg1) {
	sp = (sp - 1) & 0xFF;
	SET_M(sp, XH());
}

function op_push_xl_cb(arg0, arg1) {
	sp = (sp - 1) & 0xFF;
	SET_M(sp, XL());
}

function op_push_yp_cb(arg0, arg1) {
	sp = (sp - 1) & 0xFF;
	SET_M(sp, YP());
}

function op_push_yh_cb(arg0, arg1) {
	sp = (sp - 1) & 0xFF;
	SET_M(sp, YH());
}

function op_push_yl_cb(arg0, arg1) {
	sp = (sp - 1) & 0xFF;
	SET_M(sp, YL());
}

function op_push_f_cb(arg0, arg1) {
	sp = (sp - 1) & 0xFF;
	SET_M(sp, flags);
}

function op_pop_r_cb(arg0, arg1) {
	SET_RQ(arg0, M(sp));
	sp = (sp + 1) & 0xFF;
}

function op_pop_xp_cb(arg0, arg1) {
	x = XL() | (XH() << 4)| (M(sp) << 8);
	sp = (sp + 1) & 0xFF;
}

function op_pop_xh_cb(arg0, arg1) {
	x = XL() | (M(sp) << 4)| (XP() << 8);
	sp = (sp + 1) & 0xFF;
}

function op_pop_xl_cb(arg0, arg1) {
	x = M(sp) | (XH() << 4)| (XP() << 8);
	sp = (sp + 1) & 0xFF;
}

function op_pop_yp_cb(arg0, arg1) {
	y = YL() | (YH() << 4)| (M(sp) << 8);
	sp = (sp + 1) & 0xFF;
}

function op_pop_yh_cb(arg0, arg1) {
	y = YL() | (M(sp) << 4)| (YP() << 8);
	sp = (sp + 1) & 0xFF;
}

function op_pop_yl_cb(arg0, arg1) {
	y = M(sp) | (YH() << 4)| (YP() << 8);
	sp = (sp + 1) & 0xFF;
}

function op_pop_f_cb(arg0, arg1) {
	flags = M(sp);
	sp = (sp + 1) & 0xFF;
}

function op_ld_sph_r_cb(arg0, arg1) {
	sp = SPL() | (RQ(arg0) << 4);
}

function op_ld_spl_r_cb(arg0, arg1) {
	sp = RQ(arg0) | (SPH() << 4);
}

function op_ld_r_sph_cb(arg0, arg1) {
	SET_RQ(arg0, SPH());
}

function op_ld_r_spl_cb(arg0, arg1) {
	SET_RQ(arg0, SPL());
}

function op_add_r_i_cb(arg0, arg1) {
	let tmp;

	tmp = RQ(arg0) + arg1;
	if (D()) {
		if (tmp >= 10) {
			SET_RQ(arg0, (tmp - 10) & 0xF);
			SET_C();
		} else {
			SET_RQ(arg0, tmp);
			CLEAR_C();
		}
	} else {
		SET_RQ(arg0, tmp & 0xF);
		if (tmp >> 4) { SET_C(); } else { CLEAR_C(); }
	}
	if (!RQ(arg0)) { SET_Z(); } else { CLEAR_Z(); }
}

function op_add_r_q_cb(arg0, arg1) {
	let tmp;

	tmp = RQ(arg0) + RQ(arg1);
	if (D()) {
		if (tmp >= 10) {
			SET_RQ(arg0, (tmp - 10) & 0xF);
			SET_C();
		} else {
			SET_RQ(arg0, tmp);
			CLEAR_C();
		}
	} else {
		SET_RQ(arg0, tmp & 0xF);
		if (tmp >> 4) { SET_C(); } else { CLEAR_C(); }
	}
	if (!RQ(arg0)) { SET_Z(); } else { CLEAR_Z(); }
}

function op_adc_r_i_cb(arg0, arg1) {
	let tmp;

	tmp = RQ(arg0) + arg1 + C();
	if (D()) {
		if (tmp >= 10) {
			SET_RQ(arg0, (tmp - 10) & 0xF);
			SET_C();
		} else {
			SET_RQ(arg0, tmp);
			CLEAR_C();
		}
	} else {
		SET_RQ(arg0, tmp & 0xF);
		if (tmp >> 4) { SET_C(); } else { CLEAR_C(); }
	}
	if (!RQ(arg0)) { SET_Z(); } else { CLEAR_Z(); }
}

function op_adc_r_q_cb(arg0, arg1) {
	let tmp;

	tmp = RQ(arg0) + RQ(arg1) + C();
	if (D()) {
		if (tmp >= 10) {
			SET_RQ(arg0, (tmp - 10) & 0xF);
			SET_C();
		} else {
			SET_RQ(arg0, tmp);
			CLEAR_C();
		}
	} else {
		SET_RQ(arg0, tmp & 0xF);
		if (tmp >> 4) { SET_C(); } else { CLEAR_C(); }
	}
	if (!RQ(arg0)) { SET_Z(); } else { CLEAR_Z(); }
}

function op_sub_cb(arg0, arg1) {
	let tmp;

	tmp = RQ(arg0) - RQ(arg1);
	if (D()) {
		if (tmp >> 4) {
			SET_RQ(arg0, (tmp - 6) & 0xF);
		} else {
			SET_RQ(arg0, tmp);
		}
	} else {
		SET_RQ(arg0, tmp & 0xF);
	}
	if (tmp >> 4) { SET_C(); } else { CLEAR_C(); }
	if (!RQ(arg0)) { SET_Z(); } else { CLEAR_Z(); }
}

function op_sbc_r_i_cb(arg0, arg1) {
	let tmp;

	tmp = RQ(arg0) - arg1 - C();
	if (D()) {
		if (tmp >> 4) {
			SET_RQ(arg0, (tmp - 6) & 0xF);
		} else {
			SET_RQ(arg0, tmp);
		}
	} else {
		SET_RQ(arg0, tmp & 0xF);
	}
	if (tmp >> 4) { SET_C(); } else { CLEAR_C(); }
	if (!RQ(arg0)) { SET_Z(); } else { CLEAR_Z(); }
}

function op_sbc_r_q_cb(arg0, arg1) {
	let tmp;

	tmp = RQ(arg0) - RQ(arg1) - C();
	if (D()) {
		if (tmp >> 4) {
			SET_RQ(arg0, (tmp - 6) & 0xF);
		} else {
			SET_RQ(arg0, tmp);
		}
	} else {
		SET_RQ(arg0, tmp & 0xF);
	}
	if (tmp >> 4) { SET_C(); } else { CLEAR_C(); }
	if (!RQ(arg0)) { SET_Z(); } else { CLEAR_Z(); }
}

function op_and_r_i_cb(arg0, arg1) {
	SET_RQ(arg0, RQ(arg0) & arg1);
	if (!RQ(arg0)) { SET_Z(); } else { CLEAR_Z(); }
}

function op_and_r_q_cb(arg0, arg1) {
	SET_RQ(arg0, RQ(arg0) & RQ(arg1));
	if (!RQ(arg0)) { SET_Z(); } else { CLEAR_Z(); }
}

function op_or_r_i_cb(arg0, arg1) {
	SET_RQ(arg0, RQ(arg0) | arg1);
	if (!RQ(arg0)) { SET_Z(); } else { CLEAR_Z(); }
}

function op_or_r_q_cb(arg0, arg1) {
	SET_RQ(arg0, RQ(arg0) | RQ(arg1));
	if (!RQ(arg0)) { SET_Z(); } else { CLEAR_Z(); }
}

function op_xor_r_i_cb(arg0, arg1) {
	SET_RQ(arg0, RQ(arg0) ^ arg1);
	if (!RQ(arg0)) { SET_Z(); } else { CLEAR_Z(); }
}

function op_xor_r_q_cb(arg0, arg1) {
	SET_RQ(arg0, RQ(arg0) ^ RQ(arg1));
	if (!RQ(arg0)) { SET_Z(); } else { CLEAR_Z(); }
}

function op_cp_r_i_cb(arg0, arg1) {
	if (RQ(arg0) < arg1) { SET_C(); } else { CLEAR_C(); }
	if (RQ(arg0) == arg1) { SET_Z(); } else { CLEAR_Z(); }
}

function op_cp_r_q_cb(arg0, arg1) {
	if (RQ(arg0) < RQ(arg1)) { SET_C(); } else { CLEAR_C(); }
	if (RQ(arg0) == RQ(arg1)) { SET_Z(); } else { CLEAR_Z(); }
}

function op_fan_r_i_cb(arg0, arg1) {
	if (!(RQ(arg0) & arg1)) { SET_Z(); } else { CLEAR_Z(); }
}

function op_fan_r_q_cb(arg0, arg1) {
	if (!(RQ(arg0) & RQ(arg1))) { SET_Z(); } else { CLEAR_Z(); }
}

function op_rlc_cb(arg0, arg1) {
	let tmp;

	tmp = (RQ(arg0) << 1) | C();
	if (RQ(arg0) & 0x8) { SET_C(); } else { CLEAR_C(); }
	SET_RQ(arg0, tmp & 0xF);
	/* No need to set Z (issue in DS) */
}

function op_rrc_cb(arg0, arg1) {
	let tmp;

	tmp = (RQ(arg0) >> 1) | (C() << 3);
	if (RQ(arg0) & 0x1) { SET_C(); } else { CLEAR_C(); }
	SET_RQ(arg0, tmp & 0xF);
	/* No need to set Z (issue in DS) */
}

function op_inc_mn_cb(arg0, arg1) {
	let tmp;

	tmp = M(arg0) + 1;
	SET_M(arg0, tmp & 0xF);
	if (tmp >> 4) { SET_C(); } else { CLEAR_C(); }
	if (!M(arg0)) { SET_Z(); } else { CLEAR_Z(); }
}

function op_dec_mn_cb(arg0, arg1) {
	let tmp;

	tmp = M(arg0) - 1;
	SET_M(arg0, tmp & 0xF);
	if (tmp >> 4) { SET_C(); } else { CLEAR_C(); }
	if (!M(arg0)) { SET_Z(); } else { CLEAR_Z(); }
}

function op_acpx_cb(arg0, arg1) {
	let tmp;

	tmp = M(x) + RQ(arg0) + C();
	if (D()) {
		if (tmp >= 10) {
			SET_M(x, (tmp - 10) & 0xF);
			SET_C();
		} else {
			SET_M(x, tmp);
			CLEAR_C();
		}
	} else {
		SET_M(x, tmp & 0xF);
		if (tmp >> 4) { SET_C(); } else { CLEAR_C(); }
	}
	if (!M(x)) { SET_Z(); } else { CLEAR_Z(); }
	x = ((x + 1) & 0xFF) | (XP() << 8);
}

function op_acpy_cb(arg0, arg1) {
	let tmp;

	tmp = M(y) + RQ(arg0) + C();
	if (D()) {
		if (tmp >= 10) {
			SET_M(y, (tmp - 10) & 0xF);
			SET_C();
		} else {
			SET_M(y, tmp);
			CLEAR_C();
		}
	} else {
		SET_M(y, tmp & 0xF);
		if (tmp >> 4) { SET_C(); } else { CLEAR_C(); }
	}
	if (!M(y)) { SET_Z(); } else { CLEAR_Z(); }
	y = ((y + 1) & 0xFF) | (YP() << 8);
}

function op_scpx_cb(arg0, arg1) {
	let tmp;

	tmp = M(x) - RQ(arg0) - C();
	if (D()) {
		if (tmp >> 4) {
			SET_M(x, (tmp - 6) & 0xF);
		} else {
			SET_M(x, tmp);
		}
	} else {
		SET_M(x, tmp & 0xF);
	}
	if (tmp >> 4) { SET_C(); } else { CLEAR_C(); }
	if (!M(x)) { SET_Z(); } else { CLEAR_Z(); }
	x = ((x + 1) & 0xFF) | (XP() << 8);
}

function op_scpy_cb(arg0, arg1) {
	let tmp;

	tmp = M(y) - RQ(arg0) - C();
	if (D()) {
		if (tmp >> 4) {
			SET_M(y, (tmp - 6) & 0xF);
		} else {
			SET_M(y, tmp);
		}
	} else {
		SET_M(y, tmp & 0xF);
	}
	if (tmp >> 4) { SET_C(); } else { CLEAR_C(); }
	if (!M(y)) { SET_Z(); } else { CLEAR_Z(); }
	y = ((y + 1) & 0xFF) | (YP() << 8);
}

function op_not_cb(arg0, arg1) {
	SET_RQ(arg0, ~RQ(arg0) & 0xF);
	if (!RQ(arg0)) { SET_Z(); } else { CLEAR_Z(); }
}

/* The E0C6S46 supported instructions */
const ops = [
	new op_t(`PSET #0x%02X              `, 0xE40, MASK_7B , 0, 0    , 5 , op_pset_cb), // PSET
	new op_t(`JP   #0x%02X              `, 0x000, MASK_4B , 0, 0    , 5 , op_jp_cb), // JP
	new op_t(`JP   C #0x%02X            `, 0x200, MASK_4B , 0, 0    , 5 , op_jp_c_cb), // JP_C
	new op_t(`JP   NC #0x%02X           `, 0x300, MASK_4B , 0, 0    , 5 , op_jp_nc_cb), // JP_NC
	new op_t(`JP   Z #0x%02X            `, 0x600, MASK_4B , 0, 0    , 5 , op_jp_z_cb), // JP_Z
	new op_t(`JP   NZ #0x%02X           `, 0x700, MASK_4B , 0, 0    , 5 , op_jp_nz_cb), // JP_NZ
	new op_t(`JPBA                      `, 0xFE8, MASK_12B, 0, 0    , 5 , op_jpba_cb), // JPBA
	new op_t(`CALL #0x%02X              `, 0x400, MASK_4B , 0, 0    , 7 , op_call_cb), // CALL
	new op_t(`CALZ #0x%02X              `, 0x500, MASK_4B , 0, 0    , 7 , op_calz_cb), // CALZ
	new op_t(`RET                       `, 0xFDF, MASK_12B, 0, 0    , 7 , op_ret_cb), // RET
	new op_t(`RETS                      `, 0xFDE, MASK_12B, 0, 0    , 12, op_rets_cb), // RETS
	new op_t(`RETD #0x%02X              `, 0x100, MASK_4B , 0, 0    , 12, op_retd_cb), // RETD
	new op_t(`NOP5                      `, 0xFFB, MASK_12B, 0, 0    , 5 , op_nop5_cb), // NOP5
	new op_t(`NOP7                      `, 0xFFF, MASK_12B, 0, 0    , 7 , op_nop7_cb), // NOP7
	new op_t(`HALT                      `, 0xFF8, MASK_12B, 0, 0    , 5 , op_halt_cb), // HALT
	new op_t(`INC  X #0x%02X            `, 0xEE0, MASK_12B, 0, 0    , 5 , op_inc_x_cb), // INC_X
	new op_t(`INC  Y #0x%02X            `, 0xEF0, MASK_12B, 0, 0    , 5 , op_inc_y_cb), // INC_Y
	new op_t(`LD   X #0x%02X            `, 0xB00, MASK_4B , 0, 0    , 5 , op_ld_x_cb), // LD_X
	new op_t(`LD   Y #0x%02X            `, 0x800, MASK_4B , 0, 0    , 5 , op_ld_y_cb), // LD_Y
	new op_t(`LD   XP R(#0x%02X)        `, 0xE80, MASK_10B, 0, 0    , 5 , op_ld_xp_r_cb), // LD_XP_R
	new op_t(`LD   XH R(#0x%02X)        `, 0xE84, MASK_10B, 0, 0    , 5 , op_ld_xh_r_cb), // LD_XH_R
	new op_t(`LD   XL R(#0x%02X)        `, 0xE88, MASK_10B, 0, 0    , 5 , op_ld_xl_r_cb), // LD_XL_R
	new op_t(`LD   YP R(#0x%02X)        `, 0xE90, MASK_10B, 0, 0    , 5 , op_ld_yp_r_cb), // LD_YP_R
	new op_t(`LD   YH R(#0x%02X)        `, 0xE94, MASK_10B, 0, 0    , 5 , op_ld_yh_r_cb), // LD_YH_R
	new op_t(`LD   YL R(#0x%02X)        `, 0xE98, MASK_10B, 0, 0    , 5 , op_ld_yl_r_cb), // LD_YL_R
	new op_t(`LD   R(#0x%02X) XP        `, 0xEA0, MASK_10B, 0, 0    , 5 , op_ld_r_xp_cb), // LD_R_XP
	new op_t(`LD   R(#0x%02X) XH        `, 0xEA4, MASK_10B, 0, 0    , 5 , op_ld_r_xh_cb), // LD_R_XH
	new op_t(`LD   R(#0x%02X) XL        `, 0xEA8, MASK_10B, 0, 0    , 5 , op_ld_r_xl_cb), // LD_R_XL
	new op_t(`LD   R(#0x%02X) YP        `, 0xEB0, MASK_10B, 0, 0    , 5 , op_ld_r_yp_cb), // LD_R_YP
	new op_t(`LD   R(#0x%02X) YH        `, 0xEB4, MASK_10B, 0, 0    , 5 , op_ld_r_yh_cb), // LD_R_YH
	new op_t(`LD   R(#0x%02X) YL        `, 0xEB8, MASK_10B, 0, 0    , 5 , op_ld_r_yl_cb), // LD_R_YL
	new op_t(`ADC  XH #0x%02X           `, 0xA00, MASK_8B , 0, 0    , 7 , op_adc_xh_cb), // ADC_XH
	new op_t(`ADC  XL #0x%02X           `, 0xA10, MASK_8B , 0, 0    , 7 , op_adc_xl_cb), // ADC_XL
	new op_t(`ADC  YH #0x%02X           `, 0xA20, MASK_8B , 0, 0    , 7 , op_adc_yh_cb), // ADC_YH
	new op_t(`ADC  YL #0x%02X           `, 0xA30, MASK_8B , 0, 0    , 7 , op_adc_yl_cb), // ADC_YL
	new op_t(`CP   XH #0x%02X           `, 0xA40, MASK_8B , 0, 0    , 7 , op_cp_xh_cb), // CP_XH
	new op_t(`CP   XL #0x%02X           `, 0xA50, MASK_8B , 0, 0    , 7 , op_cp_xl_cb), // CP_XL
	new op_t(`CP   YH #0x%02X           `, 0xA60, MASK_8B , 0, 0    , 7 , op_cp_yh_cb), // CP_YH
	new op_t(`CP   YL #0x%02X           `, 0xA70, MASK_8B , 0, 0    , 7 , op_cp_yl_cb), // CP_YL
	new op_t(`LD   R(#0x%02X) #0x%02X   `, 0xE00, MASK_6B , 4, 0x030, 5 , op_ld_r_i_cb), // LD_R_I
	new op_t(`LD   R(#0x%02X) Q(#0x%02X)`, 0xEC0, MASK_8B , 2, 0x00C, 5 , op_ld_r_q_cb), // LD_R_Q
	new op_t(`LD   A M(#0x%02X)         `, 0xFA0, MASK_8B , 0, 0    , 5 , op_ld_a_mn_cb), // LD_A_MN
	new op_t(`LD   B M(#0x%02X)         `, 0xFB0, MASK_8B , 0, 0    , 5 , op_ld_b_mn_cb), // LD_B_MN
	new op_t(`LD   M(#0x%02X) A         `, 0xF80, MASK_8B , 0, 0    , 5 , op_ld_mn_a_cb), // LD_MN_A
	new op_t(`LD   M(#0x%02X) B         `, 0xF90, MASK_8B , 0, 0    , 5 , op_ld_mn_b_cb), // LD_MN_B
	new op_t(`LDPX MX #0x%02X           `, 0xE60, MASK_8B , 0, 0    , 5 , op_ldpx_mx_cb), // LDPX_MX
	new op_t(`LDPX R(#0x%02X) Q(#0x%02X)`, 0xEE0, MASK_8B , 2, 0x00C, 5 , op_ldpx_r_cb), // LDPX_R
	new op_t(`LDPY MY #0x%02X           `, 0xE70, MASK_8B , 0, 0    , 5 , op_ldpy_my_cb), // LDPY_MY
	new op_t(`LDPY R(#0x%02X) Q(#0x%02X)`, 0xEF0, MASK_8B , 2, 0x00C, 5 , op_ldpy_r_cb), // LDPY_R
	new op_t(`LBPX #0x%02X              `, 0x900, MASK_4B , 0, 0    , 5 , op_lbpx_cb), // LBPX
	new op_t(`SET  #0x%02X              `, 0xF40, MASK_8B , 0, 0    , 7 , op_set_cb), // SET
	new op_t(`RST  #0x%02X              `, 0xF50, MASK_8B , 0, 0    , 7 , op_rst_cb), // RST
	new op_t(`SCF                       `, 0xF41, MASK_12B, 0, 0    , 7 , op_scf_cb), // SCF
	new op_t(`RCF                       `, 0xF5E, MASK_12B, 0, 0    , 7 , op_rcf_cb), // RCF
	new op_t(`SZF                       `, 0xF42, MASK_12B, 0, 0    , 7 , op_szf_cb), // SZF
	new op_t(`RZF                       `, 0xF5D, MASK_12B, 0, 0    , 7 , op_rzf_cb), // RZF
	new op_t(`SDF                       `, 0xF44, MASK_12B, 0, 0    , 7 , op_sdf_cb), // SDF
	new op_t(`RDF                       `, 0xF5B, MASK_12B, 0, 0    , 7 , op_rdf_cb), // RDF
	new op_t(`EI                        `, 0xF48, MASK_12B, 0, 0    , 7 , op_ei_cb), // EI
	new op_t(`DI                        `, 0xF57, MASK_12B, 0, 0    , 7 , op_di_cb), // DI
	new op_t(`INC  SP                   `, 0xFDB, MASK_12B, 0, 0    , 5 , op_inc_sp_cb), // INC_SP
	new op_t(`DEC  SP                   `, 0xFCB, MASK_12B, 0, 0    , 5 , op_dec_sp_cb), // DEC_SP
	new op_t(`PUSH R(#0x%02X)           `, 0xFC0, MASK_10B, 0, 0    , 5 , op_push_r_cb), // PUSH_R
	new op_t(`PUSH XP                   `, 0xFC4, MASK_12B, 0, 0    , 5 , op_push_xp_cb), // PUSH_XP
	new op_t(`PUSH XH                   `, 0xFC5, MASK_12B, 0, 0    , 5 , op_push_xh_cb), // PUSH_XH
	new op_t(`PUSH XL                   `, 0xFC6, MASK_12B, 0, 0    , 5 , op_push_xl_cb), // PUSH_XL
	new op_t(`PUSH YP                   `, 0xFC7, MASK_12B, 0, 0    , 5 , op_push_yp_cb), // PUSH_YP
	new op_t(`PUSH YH                   `, 0xFC8, MASK_12B, 0, 0    , 5 , op_push_yh_cb), // PUSH_YH
	new op_t(`PUSH YL                   `, 0xFC9, MASK_12B, 0, 0    , 5 , op_push_yl_cb), // PUSH_YL
	new op_t(`PUSH F                    `, 0xFCA, MASK_12B, 0, 0    , 5 , op_push_f_cb), // PUSH_F
	new op_t(`POP  R(#0x%02X)           `, 0xFD0, MASK_10B, 0, 0    , 5 , op_pop_r_cb), // POP_R
	new op_t(`POP  XP                   `, 0xFD4, MASK_12B, 0, 0    , 5 , op_pop_xp_cb), // POP_XP
	new op_t(`POP  XH                   `, 0xFD5, MASK_12B, 0, 0    , 5 , op_pop_xh_cb), // POP_XH
	new op_t(`POP  XL                   `, 0xFD6, MASK_12B, 0, 0    , 5 , op_pop_xl_cb), // POP_XL
	new op_t(`POP  YP                   `, 0xFD7, MASK_12B, 0, 0    , 5 , op_pop_yp_cb), // POP_YP
	new op_t(`POP  YH                   `, 0xFD8, MASK_12B, 0, 0    , 5 , op_pop_yh_cb), // POP_YH
	new op_t(`POP  YL                   `, 0xFD9, MASK_12B, 0, 0    , 5 , op_pop_yl_cb), // POP_YL
	new op_t(`POP  F                    `, 0xFDA, MASK_12B, 0, 0    , 5 , op_pop_f_cb), // POP_F
	new op_t(`LD   SPH R(#0x%02X)       `, 0xFE0, MASK_10B, 0, 0    , 5 , op_ld_sph_r_cb), // LD_SPH_R
	new op_t(`LD   SPL R(#0x%02X)       `, 0xFF0, MASK_10B, 0, 0    , 5 , op_ld_spl_r_cb), // LD_SPL_R
	new op_t(`LD   R(#0x%02X) SPH       `, 0xFE4, MASK_10B, 0, 0    , 5 , op_ld_r_sph_cb), // LD_R_SPH
	new op_t(`LD   R(#0x%02X) SPL       `, 0xFF4, MASK_10B, 0, 0    , 5 , op_ld_r_spl_cb), // LD_R_SPL
	new op_t(`ADD  R(#0x%02X) #0x%02X   `, 0xC00, MASK_6B , 4, 0x030, 7 , op_add_r_i_cb), // ADD_R_I
	new op_t(`ADD  R(#0x%02X) Q(#0x%02X)`, 0xA80, MASK_8B , 2, 0x00C, 7 , op_add_r_q_cb), // ADD_R_Q
	new op_t(`ADC  R(#0x%02X) #0x%02X   `, 0xC40, MASK_6B , 4, 0x030, 7 , op_adc_r_i_cb), // ADC_R_I
	new op_t(`ADC  R(#0x%02X) Q(#0x%02X)`, 0xA90, MASK_8B , 2, 0x00C, 7 , op_adc_r_q_cb), // ADC_R_Q
	new op_t(`SUB  R(#0x%02X) Q(#0x%02X)`, 0xAA0, MASK_8B , 2, 0x00C, 7 , op_sub_cb), // SUB
	new op_t(`SBC  R(#0x%02X) #0x%02X   `, 0xB40, MASK_6B , 4, 0x030, 7 , op_sbc_r_i_cb), // SBC_R_I
	new op_t(`SBC  R(#0x%02X) Q(#0x%02X)`, 0xAB0, MASK_8B , 2, 0x00C, 7 , op_sbc_r_q_cb), // SBC_R_Q
	new op_t(`AND  R(#0x%02X) #0x%02X   `, 0xC80, MASK_6B , 4, 0x030, 7 , op_and_r_i_cb), // AND_R_I
	new op_t(`AND  R(#0x%02X) Q(#0x%02X)`, 0xAC0, MASK_8B , 2, 0x00C, 7 , op_and_r_q_cb), // AND_R_Q
	new op_t(`OR   R(#0x%02X) #0x%02X   `, 0xCC0, MASK_6B , 4, 0x030, 7 , op_or_r_i_cb), // OR_R_I
	new op_t(`OR   R(#0x%02X) Q(#0x%02X)`, 0xAD0, MASK_8B , 2, 0x00C, 7 , op_or_r_q_cb), // OR_R_Q
	new op_t(`XOR  R(#0x%02X) #0x%02X   `, 0xD00, MASK_6B , 4, 0x030, 7 , op_xor_r_i_cb), // XOR_R_I
	new op_t(`XOR  R(#0x%02X) Q(#0x%02X)`, 0xAE0, MASK_8B , 2, 0x00C, 7 , op_xor_r_q_cb), // XOR_R_Q
	new op_t(`CP   R(#0x%02X) #0x%02X   `, 0xDC0, MASK_6B , 4, 0x030, 7 , op_cp_r_i_cb), // CP_R_I
	new op_t(`CP   R(#0x%02X) Q(#0x%02X)`, 0xF00, MASK_8B , 2, 0x00C, 7 , op_cp_r_q_cb), // CP_R_Q
	new op_t(`FAN  R(#0x%02X) #0x%02X   `, 0xD80, MASK_6B , 4, 0x030, 7 , op_fan_r_i_cb), // FAN_R_I
	new op_t(`FAN  R(#0x%02X) Q(#0x%02X)`, 0xF10, MASK_8B , 2, 0x00C, 7 , op_fan_r_q_cb), // FAN_R_Q
	new op_t(`RLC  R(#0x%02X)           `, 0xAF0, MASK_8B , 0, 0    , 7 , op_rlc_cb), // RLC
	new op_t(`RRC  R(#0x%02X)           `, 0xE8C, MASK_10B, 0, 0    , 5 , op_rrc_cb), // RRC
	new op_t(`INC  M(#0x%02X)           `, 0xF60, MASK_8B , 0, 0    , 7 , op_inc_mn_cb), // INC_MN
	new op_t(`DEC  M(#0x%02X)           `, 0xF70, MASK_8B , 0, 0    , 7 , op_dec_mn_cb), // DEC_MN
	new op_t(`ACPX R(#0x%02X)           `, 0xF28, MASK_10B, 0, 0    , 7 , op_acpx_cb), // ACPX
	new op_t(`ACPY R(#0x%02X)           `, 0xF2C, MASK_10B, 0, 0    , 7 , op_acpy_cb), // ACPY
	new op_t(`SCPX R(#0x%02X)           `, 0xF38, MASK_10B, 0, 0    , 7 , op_scpx_cb), // SCPX
	new op_t(`SCPY R(#0x%02X)           `, 0xF3C, MASK_10B, 0, 0    , 7 , op_scpy_cb), // SCPY
	new op_t(`NOT  R(#0x%02X)           `, 0xD0F, 0xFCF   , 4, 0    , 7 , op_not_cb), // NOT

	new op_t(NULL, 0, 0, 0, 0, 0, NULL)
];

function wait_for_cycles(since, cycles) {
	let deadline;

	tick_counter += cycles;

	if (speed_ratio == 0) {
		/* Emulation will be as fast as possible */
		return g_hal.get_timestamp();
	}

	deadline = since + (cycles * ts_freq)/(TICK_FREQUENCY * speed_ratio);
	g_hal.sleep_until(deadline);

	return deadline;
}

function process_interrupts() {
	let i;

	/* Process interrupts in priority order */
	for (i = 0; i < int_slot_t.INT_SLOT_NUM; i++) {
		if (interrupts[i].triggered) {
			//printf("IT %u !\n", i);
			SET_M(sp - 1, PCP());
			SET_M(sp - 2, PCSH());
			SET_M(sp - 3, PCSL());
			sp = (sp - 3) & 0xFF;
			CLEAR_I();
			np = TO_NP(NBP(), 1);
			pc = TO_PC(PCB(), 1, interrupts[i].vector);
			call_depth++;

			ref_ts = wait_for_cycles(ref_ts, 12);
			interrupts[i].triggered = 0;
		}
	}
}

function print_state(op_num, op, addr) {
	let i;

    if (!g_hal.is_log_enabled(log_level_t.LOG_CPU)) {
		return;
	}
    
    g_hal.log(log_level_t.LOG_CPU, NumToHex(addr, 4) + ": ");
    //g_hal.log(log_level_t.LOG_CPU, "0x%04X: ", addr);

	for (i = 0; i < call_depth; i++) {
        g_hal.log(log_level_t.LOG_CPU, "  ");
	}

	if (ops[op_num].mask_arg0 != 0) {
		/* Two arguments */
		g_hal.log(log_level_t.LOG_CPU, ops[op_num].log, (op & ops[op_num].mask_arg0) >> ops[op_num].shift_arg0, op & ~(ops[op_num].mask | ops[op_num].mask_arg0));
	} else {
		/* One argument */
		g_hal.log(log_level_t.LOG_CPU, ops[op_num].log, (op & ~ops[op_num].mask) >> ops[op_num].shift_arg0);
	}

	if (call_depth < 10) {
		for (i = 0; i < (10 - call_depth); i++) {
			g_hal.log(log_level_t.LOG_CPU, "  ");
		}
	}

    g_hal.log(log_level_t.LOG_CPU, " ; " + NumToHex(op, 3) + " - ");
	//g_hal.log(log_level_t.LOG_CPU, " ; 0x%03X - ", op);
	for (i = 0; i < 12; i++) {
		g_hal.log(log_level_t.LOG_CPU, ((op >> (11 - i)) & 0x1) ? "1" : "0");
        //g_hal.log(log_level_t.LOG_CPU, "%s", ((op >> (11 - i)) & 0x1) ? "1" : "0");
	}
    g_hal.log(log_level_t.LOG_CPU, ` - PC = ${NumToHex(pc, 4)}, SP = ${NumToHex(sp, 2)}, NP = ${NumToHex(np, 2)}, X = ${NumToHex(x, 3)}, Y = ${NumToHex(y, 3)}, A = ${NumToHex(a, 0)}, B = ${NumToHex(b, 0)}, F = ${NumToHex(flags, 0)}\n`);
	//g_hal.log(log_level_t.LOG_CPU, " - PC = 0x%04X, SP = 0x%02X, NP = 0x%02X, X = 0x%03X, Y = 0x%03X, A = 0x%X, B = 0x%X, F = 0x%X\n", pc, sp, np, x, y, a, b, flags);
}

function cpu_reset() {
	let i;

	/* Registers and variables init */
	pc = TO_PC(0, 1, 0x00); // PC starts at bank 0, page 1, step 0
	np = TO_NP(0, 1); // NP starts at page 1
	a = 0; // undef
	b = 0; // undef
	x = 0; // undef
	y = 0; // undef
	sp = 0; // undef
	flags = 0;

	/* Init RAM to zeros */
	for (i = 0; i < MEM_BUFFER_SIZE(); i++) {
		memory[i] = 0;
	}

	SET_IO_MEMORY(memory, REG_K40_K43_BZ_OUTPUT_PORT, 0xF); // Output port (R40-R43)
	SET_IO_MEMORY(memory, REG_LCD_CTRL, 0x8); // LCD control
	/* TODO: Input relation register */

	cpu_sync_ref_timestamp();
}

function cpu_init(program, breakpoints, freq) {
	g_program = program;
	g_breakpoints = breakpoints;
	ts_freq = freq;

	cpu_reset();

	return 0;
}

function cpu_init_from_state(program, state, breakpoints, freq) {
    g_program = program;
    g_breakpoints = breakpoints;
    ts_freq = freq;
    
    cpu_set_state(state);
    cpu_sync_ref_timestamp();
    
    return 0;
}

function cpu_release() {
}

let previous_cycles = 0;

function cpu_step() {
	let op;
	let i;
	let bp = g_breakpoints;

	op = g_program[pc];

	/* Lookup the OP code */
    for (i = 0; ops[i].log != NULL; i++) {
		if ((op & ops[i].mask) == ops[i].code) {
			break;
		}
	}

	if (ops[i].log == NULL) {
        g_hal.log(log_level_t.LOG_ERROR, `Unknown op-code ${NumToHex(op, 0)} (pc = ${NumToHex(pc, 4)})\n`);
        //g_hal.log(log_level_t.LOG_ERROR, "Unknown op-code 0x%X (pc = 0x%04X)\n", op, pc);
		return 1;
	}

	next_pc = (pc + 1) & 0x1FFF;

	/* Display the operation along with the current state of the processor */
	print_state(i, op, pc);

	/* Match the speed of the real processor
	 * NOTE: For better accuracy, the final wait should happen here, however
	 * the downside is that all interrupts will likely be delayed by one OP
	 */
	ref_ts = wait_for_cycles(ref_ts, previous_cycles);

	/* Process the OP code */
	if (ops[i].cb != NULL) {
		if (ops[i].mask_arg0 != 0) {
			/* Two arguments */
			ops[i].cb((op & ops[i].mask_arg0) >> ops[i].shift_arg0, op & ~(ops[i].mask | ops[i].mask_arg0));
		} else {
			/* One arguments */
			ops[i].cb((op & ~ops[i].mask) >> ops[i].shift_arg0, 0);
		}
	}

	/* Prepare for the next instruction */
	pc = next_pc;
	previous_cycles = ops[i].cycles;

	if (i > 0) {
		/* OP code is not PSET, reset NP */
		np = (pc >> 8) & 0x1F;
	}

	/* Handle timers using the internal tick counter */
	if (tick_counter - clk_timer_timestamp >= TIMER_1HZ_PERIOD) {
		do {
			clk_timer_timestamp += TIMER_1HZ_PERIOD;
		} while (tick_counter - clk_timer_timestamp >= TIMER_1HZ_PERIOD);

		generate_interrupt(int_slot_t.INT_CLOCK_TIMER_SLOT, 3);
	}

	if (prog_timer_enabled && tick_counter - prog_timer_timestamp >= TIMER_256HZ_PERIOD) {
		do {
			prog_timer_timestamp += TIMER_256HZ_PERIOD;
			prog_timer_data--;

			if (prog_timer_data == 0) {
				prog_timer_data = prog_timer_rld;
                generate_interrupt(int_slot_t.INT_PROG_TIMER_SLOT, 0);
			}
		} while (tick_counter - prog_timer_timestamp >= TIMER_256HZ_PERIOD);
	}

	/* Check if there is any pending interrupt */
	if (I() && i > 0) { // Do not process interrupts after a PSET operation
		process_interrupts();
	}

	/* Check if we could pause the execution */
	while (bp != NULL) {
        if (bp.addr == pc) {
			return 1;
		}

		bp = bp.next;
	}

	return 0;
}