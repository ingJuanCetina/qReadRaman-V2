# pw-lda
Linear discriminant analysis in JavaScript

## Installation

```bash
npm install pw-lda
```

## Getting Started

Two-dimensions are used in the below example, but any number of dimensions may be used.

LDA support both binary and multiclass classification. For multiclass classification, a pairwise voting system is used to extend the binary classifier to multiclass.

```javascript
const LDA = require('pw-lda');

// Example with 2 classes

let class1 = [
	[0, 0],
	[1, 2],
	[2, 2],
	[1.5, 0.5]
];

let class2 = [
	[8, 8],
	[9, 10],
	[7, 8],
	[9, 9]
];

let classifier = new LDA(class1, class2);

let unknownPoints = [
	[-1, 0],
	[1.5, 2],
	[3, 3],
	[5, 5],
	[7, 9],
	[10, 12]
];

let predictions = [];

for(let i = 0; i < unknownPoints.length; i++){
	predictions.push(classifier.classify(unknownPoints[i]));
}

console.log(predictions); // [ 0, 0, 0, 1, 1, 1 ]

// Extending to a multiclass example

let class3 = [
	[-1, 10],
	[0, 12],
	[1, 11],
	[0.5, 9]
];

unknownPoints = unknownPoints.concat([
	[0, 11],
	[-1, 8],
	[1, 9]
]);

classifier = new LDA(class1, class2, class3);

predictions = [];

for(let i = 0; i < unknownPoints.length; i++){
	predictions.push(classifier.classify(unknownPoints[i]));
}

console.log(predictions); // [ 0, 0, 0, 1, 1, 1, 2, 2, 2 ]
```

## Documentation

Documentation is available at [http://pwstegman.me/pw-lda/](http://pwstegman.me/pw-lda/)
