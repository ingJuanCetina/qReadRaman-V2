const math = require('mathjs/core').create();
math.import(require('mathjs/lib/type/matrix'));
math.import(require('mathjs/lib/function/arithmetic'));
math.import(require('mathjs/lib/function/matrix'));

var stat = require('pw-stat');

/**
 * An LDA object.
 * @constructor
 * @param {...number[][]} classes - Each parameter is a 2d class array. In each class array, rows are samples, columns are variables.
 * @example
 * let classifier = new LDA(class1, class2, class3);
 */
function LDA(...classes) {
	// Compute pairwise LDA classes (needed for multiclass LDA)
	if(classes.length < 2) {
		throw new Error('Please pass at least 2 classes');
	}

	let numberOfPairs = classes.length * (classes.length - 1) / 2;
	let pair1 = 0;
	let pair2 = 1;

	let pairs = new Array(numberOfPairs);

	for(let i = 0; i < numberOfPairs; i++){
		pairs[i] = computeLdaParams(classes[pair1], classes[pair2], pair1, pair2);

		pair2++;
		if(pair2 == classes.length) {
			pair1++;
			pair2 = pair1 + 1;
		}
	} 

	this.pairs = pairs;
	this.numberOfClasses = classes.length;
}

function computeLdaParams(class1, class2, class1id, class2id) {
	let mu1 = math.transpose(stat.mean(class1));
	let mu2 = math.transpose(stat.mean(class2));
	let pooledCov = math.add(stat.cov(class1), stat.cov(class2));
	let theta = math.multiply(math.inv(pooledCov), math.subtract(mu2, mu1));
	let b = math.multiply(-1, math.transpose(theta), math.add(mu1, mu2), 1 / 2);

	return {
		theta: theta,
		b: b,
		class1id: class1id,
		class2id: class2id
	}
}

/**
 * Project the unknown data point to one dimension.
 * Currently only supports binary LDA.
 * @param {number[]} point - The data point to be projected.
 * @returns {number} value less than 0 if predicted to be in class 1, 0 if exactly in between, greater than 0 if class 2
 */
LDA.prototype.project = function (point) {
	if(this.pairs.length != 1) {
		throw new Error('LDA project currently only supports 2 classes. LDA classify can be used to perform multiclass classification.');
	}

	return projectPoint(point, this.pairs[0].theta, this.pairs[0].b);
}

function projectPoint(point, theta, b) {
	return math.add(math.multiply(point, theta), b);
}

/**
 * Classify an unknown point. Uses a pairwise voting system in the event of multiclass classification.
 * @param {number[]} point - The data point to be classified.
 * @returns {number} Returns the predicted class. Class numbers range from 0 to (number_of_classes - 1).
 */
LDA.prototype.classify = function(point) {
	// In the event of a binary classifier, skip the voting process
	if(this.numberOfClasses == 2) {
		return projectPoint(point, this.pairs[0].theta, this.pairs[0].b) <= 0 ? 0 : 1;
	}

	// Start each class with 0 votes
	let votes = new Array(this.numberOfClasses);
	for(let i = 0; i < this.numberOfClasses; i++) {
		votes[i] = 0;
	}

	// Allow each pair to cast a vote
	for(let i = 0; i < this.pairs.length; i++) {
		let params = this.pairs[i];
		let projection = projectPoint(point, params.theta, params.b);

		if(projection <= 0) {
			votes[params.class1id]++;
		} else {
			votes[params.class2id]++;
		}
	}

	// Find the winning class
	let classificaion = 0;
	let maxVotes = votes[0];
	for(let i = 1; i < votes.length; i++){
		if(votes[i] > maxVotes) {
			classificaion = i;
			maxVotes = votes[i];
		}
	}

	return classificaion;
}

module.exports = LDA;
