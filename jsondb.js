const fs = require('fs');
const path = require('path');

function addJson(str) {
	if (!/\.json$/.test(str)) {
		str += '.json';
	}

	return str;
}

function errorFunc(error) {
    if (error) console.error(error);
}

module.exports = {
	basePath: '.',
	get(dataPath) {
		dataPath = addJson(dataPath);
		let fullPath = path.join(this.basePath, dataPath);
	    return JSON.parse(fs.readFileSync(fullPath));
	},
	remove(dataPath, removeBackup = false) {
		dataPath = addJson(dataPath);
		let fullPath = path.join(this.basePath, dataPath);
	    fs.unlink(fullPath, errorFunc);
		if (removeBackup) {
		    fs.unlink(fullPath.replace(/\.json$/, '.backup'), errorFunc);
		}
	},
	update(data, dataPath) {
		dataPath = addJson(dataPath);
		let fullPath = path.join(this.basePath, dataPath);
		if (!fs.existsSync(fullPath)) {
		    this.write(data, dataPath);
		} else {
			let dbData = this.get(dataPath);
			if (typeof dbData != 'object' && dbData !== null) {
				console.error(`'${dataPath}' is not an Object and cannot be updated. Use 'jsondb.write' instead.`);
			} else if (dbData instanceof Array) {
				console.warn(`${dataPath} is an Array. Updating has no effect. Use 'jsondb.write instead'`);
			} else {
				let newData = Object.assign(dbData, data);
				fs.copyFileSync(fullPath, fullPath.replace(/\.json$/, '.backup'));
				fs.writeFileSync(fullPath, JSON.stringify(newData));
			}
		}
	},
	write(data, dataPath, overwrite = false) {
		dataPath = addJson(dataPath);
		let fullPath = path.join(this.basePath, dataPath);
		if (fs.existsSync(fullPath) && !overwrite) {
			console.error("File already exists. To overwrite this file, set 'overwrite' equal to 'true'.");
		} else {
		  	fs.writeFileSync(fullPath, JSON.stringify(data));
		}
	},
}
