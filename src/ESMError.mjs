

export default class ESMError extends Error {

    
    status(status) {
        this._status = status;
        return this;
    }


    code(code) {
        this._code = code;
        return this;
    }


    data(data) {
        this._data = data;
    }
}