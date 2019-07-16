const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

function addJson(str) {
	if (!/\.json$/.test(str)) {
		str += '.json';
	}

	return str;
}

module.exports = {
	basePath: '.',
	async get(dataPath) {
		dataPath = addJson(dataPath);
		let fullPath = path.join(this.basePath, dataPath);
		try {
			return JSON.parse(await fsp.readFile(fullPath));
		} catch (error) {
			if (error.name == 'SyntaxError') {
				let backup = JSON.parse(await fsp.readFile(fullPath.replace(/\.json$/, '.backup')));
				await this.write(dataPath, backup, true);
				return backup;
			}
		}
	},
	remove(dataPath, removeBackup = false) {
		dataPath = addJson(dataPath);
		let fullPath = path.join(this.basePath, dataPath);
		fsp.unlink(fullPath);
		if (removeBackup) {
			fsp.unlink(fullPath.replace(/\.json$/, '.backup'));
		}
	},
	async update(dataPath, data) {
		dataPath = addJson(dataPath);
		let fullPath = path.join(this.basePath, dataPath);
		if (!fs.existsSync(fullPath)) {
			this.write(dataPath, data);
		} else {
			let dbData = await this.get(dataPath);
			if (typeof dbData != 'object' && dbData !== null) {
				console.error(`'${dataPath}' is not an Object and cannot be updated. Use 'jsondb.write' instead.`);
			} else if (dbData instanceof Array) {
				console.warn(`${dataPath} is an Array. Updating has no effect. Use 'jsondb.write instead'`);
			} else {
				let newData = Object.assign(dbData, data);
				fsp.copyFile(fullPath, fullPath.replace(/\.json$/, '.backup'))
					.then(()=> fsp.writeFile(fullPath, JSON.stringify(newData)));
			}
		}
	},
	async write(dataPath, data, overwrite = false) {
		dataPath = addJson(dataPath);
		let fullPath = path.join(this.basePath, dataPath);
		if (fs.existsSync(fullPath) && !overwrite) {
			console.error("File already exists. To overwrite this file, set 'overwrite' equal to 'true'.");
		} else {
			await fsp.writeFile(fullPath, JSON.stringify(data));
		}
	},
}
