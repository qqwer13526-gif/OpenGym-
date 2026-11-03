// Simplified educational anatomy map, not a load/activation model.
export const anatomy = [
 ['pectoralis','胸大肌','胸部',80,70,['bench-barbell','bench-dumbbell']],
 ['serratus','前锯肌','胸部',350,55,[]],
 ['deltoid','三角肌','肩部',540,55,['press-barbell']],
 ['biceps','肱二头肌','手臂',70,380,[]],
 ['triceps','肱三头肌','手臂',330,420,['pushdown-cable','bench-barbell','press-barbell']],
 ['brachialis','肱肌','手臂',75,565,[]],
 ['latissimus','背阔肌','背部',930,310,['row-barbell','row-cable']],
 ['trapezius','斜方肌','背部',870,115,[]],
 ['erectors','竖脊肌群','背部',650,420,['deadlift-barbell']],
 ['quadriceps','股四头肌群','腿部',370,535,['squat-barbell']],
 ['hamstrings','腘绳肌群','腿部',905,535,['deadlift-barbell']],
 ['gluteus','臀大肌','腿部',550,445,['squat-barbell','deadlift-barbell']]
].map(([id,name,parent,x,y,exercises])=>({id:'anatomy:'+id,name,parent,x,y,exercises}));
export const anatomySource='https://openstax.org/books/anatomy-and-physiology-2e/pages/11-chapter-review';
