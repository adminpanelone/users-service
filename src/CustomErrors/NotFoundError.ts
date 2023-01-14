const { MoleculerError } = require("moleculer").Errors;

export default class NotFoundError extends MoleculerError {
    constructor(msg: string, type: string) {
        super(msg || `Resources not found.`, 404, type || "NOT_FOUND");
    }
}