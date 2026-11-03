const upper='https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs';
const lower='https://openstax.org/books/anatomy-and-physiology-2e/pages/11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs';
const axial='https://openstax.org/books/anatomy-and-physiology-2e/pages/11-3-axial-muscles-of-the-head-neck-and-back';
const neck='https://www.cuh.nhs.uk/patient-information/neck-exercises-and-advice/';
// General educational summaries. Everyday examples illustrate actions, not treatment claims.
export const muscleGuides={
 'muscle:胸部': ['推动与合拢手臂','胸大肌帮助上臂向身体中线靠拢、内旋；不同部分也参与抬臂。','推门、拥抱时会用到。胸部区域的前锯肌则参与肩胛骨的控制。',upper],
 'muscle:背部': ['拉动手臂，控制肩胛与躯干','背阔肌参与上臂后伸、内收；斜方肌等控制肩胛骨；竖脊肌群支持脊柱伸展。','背部不是一块肌肉，不同部分承担不同任务。划船与保持躯干稳定，用到的分工并不相同。',upper],
 'muscle:肩部': ['让手臂抬起并改变方向','三角肌不同部分参与向前、向侧方及向后抬臂。肩袖等肌肉还协助稳定肩关节。','拿高处物品时，肩关节与肩胛骨需要协同活动。',upper],
 'muscle:手臂': ['弯曲、伸直肘关节','肱二头肌和肱肌参与屈肘，肱三头肌负责伸肘；肱二头肌也帮助掌心转向上。','把杯子送到嘴边、推开门，都需要手臂肌肉配合。',upper],
 'muscle:腿部': ['支撑身体，推动行走','股四头肌群伸膝；腘绳肌群屈膝并大多参与伸髋；臀大肌是重要的伸髋肌。','起立、爬楼与迈步，需要髋、膝及踝周围肌肉共同工作。',lower],
 'anatomy:pectoralis': ['上臂内收、内旋','胸大肌让上臂向胸前靠拢，也参与内旋；锁骨部参与肩关节屈曲。','拥抱或向前推物时参与发力。',upper],
 'anatomy:serratus': ['让肩胛骨贴合胸廓','前锯肌使肩胛骨前伸，并参与上回旋。','向前伸手和抬高手臂都需要肩胛骨顺畅移动，不必一直夹紧肩胛。',upper],
 'anatomy:deltoid': ['多方向抬臂','三角肌中部主要参与外展；前部参与前抬与内旋，后部参与后伸与外旋。','侧向抬手和向后伸手，使用的部分有所不同。',upper],
 'anatomy:biceps': ['屈肘与前臂旋后','肱二头肌帮助弯曲肘关节，也让前臂转向掌心朝上的方向。','端碗或把手心翻向上时参与工作。',upper],
 'anatomy:triceps': ['伸直肘关节','肱三头肌主要负责伸肘；长头还跨过肩关节。','推门、撑起身体时参与发力，但不是单靠它完成。',upper],
 'anatomy:brachialis': ['稳定地弯曲肘关节','肱肌位于肱二头肌深面，是重要的屈肘肌。','无论掌心朝向如何，弯肘拿起物品都会用到它。',upper],
 'anatomy:latissimus': ['把上臂拉向身体','背阔肌参与上臂后伸、内收和内旋。','攀拉和向后拉物时参与发力；它不直接负责把头部拉回中立位。',upper],
 'anatomy:trapezius': ['调节肩胛骨的位置','斜方肌不同部分参与肩胛骨上提、后缩、下降和上回旋。','耸肩、拉回肩胛及举高手臂都可能用到它，并非只负责“把肩向后夹”。',upper],
 'anatomy:erectors': ['伸展并支持脊柱','竖脊肌群双侧共同作用可伸展脊柱，单侧作用可参与侧屈。','弯腰后起身和保持躯干位置时参与工作；稳定不等于一直向后挺腰。',axial],
 'anatomy:quadriceps': ['伸直膝关节','股四头肌群主要伸膝，其中股直肌还跨髋，参与屈髋。','起立、上楼与控制下蹲过程中都会参与。',lower],
 'anatomy:hamstrings': ['屈膝，并帮助伸髋','腘绳肌群主要参与屈膝，多数部分也参与伸髋；股二头肌短头不跨髋。','走路后蹬、弯膝和控制髋部前倾时参与工作。',lower],
 'anatomy:gluteus': ['伸髋，帮助身体起身','臀大肌主要参与伸髋和髋外旋。','从椅子起立、爬楼和上坡时发挥作用，不能仅凭臀部力量判断骨盆姿势。',lower]
};
export const postureNote={
 title:'练背能让颈前伸“回正”吗？',
 text:'背部训练可锻炼肩胛与躯干相关肌肉，但不能保证把头颈“牵引回正”。头颈位置也涉及颈部肌肉控制、胸椎活动和日常姿势。与其持续用力夹背、后仰脖子，更应避免长时间保持同一姿势，适度变换和活动。',
 care:'若伴有持续疼痛、手臂麻木或无力，应先寻求医生或物理治疗师评估。',
 source:neck
};
