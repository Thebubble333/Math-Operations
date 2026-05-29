const rInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const rBool = () => Math.random() < 0.5;
const rSign = () => Math.random() < 0.5 ? 1 : -1;
const rNonZero = (min: number, max: number) => {
    let v = rInt(min, max);
    while (v === 0) v = rInt(min, max);
    return v * rSign();
};

console.log("TS code runs");
