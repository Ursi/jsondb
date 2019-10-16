const fs = require('fs'),
	fsp = fs.promises,
	path = require('path');

function addJson(str) {
	if (!/\.json$/.test(str)) {
		str += '.json';
	}

	return str;
}

module.exports = class {
	constructor(basePath = '.') {
		this.basePath = basePath;
	}

	async get(dataPath) {
		dataPath = addJson(dataPath);
		let fullPath = path.join(this.basePath, dataPath);
		try {
			return JSON.parse(await fsp.readFile(fullPath));
		} catch (error) {
			if (error.name == 'SyntaxError') {
				let backup = JSON.parse(await fsp.readFile(fullPath.replace(/\.json$/, '.backup')));
				await this.write(dataPath, backup, {overwrite: true, backup: false});
				return backup;
			}
		}
	}

	remove(dataPath, removeBackup = false) {
		dataPath = addJson(dataPath);
		let fullPath = path.join(this.basePath, dataPath);
		fsp.unlink(fullPath);
		if (removeBackup) {
			fsp.unlink(fullPath.replace(/\.json$/, '.backup'));
		}
	}

	async update(dataPath, data, {
		replacer = null,
		space = ``,
	} = {}) {
		dataPath = addJson(dataPath);
		let fullPath = path.join(this.basePath, dataPath);
		if (!fs.existsSync(fullPath)) {
			this.write(dataPath, data);
		} else {
			let dbData = await this.get(dataPath);
			if (typeof dbData != 'object' && dbData !== null) {
				console.error(`'${dataPath}' is not an Object and cannot be updated. Use 'jsondb.write' instead.`);
			} else if (Array.isArray(dbData)) {
				console.warn(`${dataPath} is an Array. Updating has no effect. Use 'jsondb.write instead'`);
			} else {
				let newData = Object.assign(dbData, data);
				await fsp.copyFile(fullPath, fullPath.replace(/\.json$/, '.backup'));
				fsp.writeFile(fullPath, JSON.stringify(newData, replacer, space));
			}
		}
	}

	async write(dataPath, data, {
		overwrite = false,
		backup = true,
		replacer = null,
		space = ``,
	} = {}) {
		dataPath = addJson(dataPath);
		let fullPath = path.join(this.basePath, dataPath);
		if (fs.existsSync(fullPath) && !overwrite) {
			console.error("File already exists. To overwrite this file, set 'overwrite' equal to 'true'.");
		} else {
			if (fs.existsSync(fullPath) && backup) {
				await fsp.copyFile(fullPath, fullPath.replace(/\.json$/, '.backup'));
			}

			await fsp.writeFile(fullPath, JSON.stringify(data, replacer, space));
		}
	}
}
