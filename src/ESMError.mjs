

export default class ESMError extends Error {

    
    setStatus(status) {
        this.status = status;
        return this;
    }


    setCode(code) {
        this.code = code;
        return this;
    }


    setData(data) {
        this.data = data;
    }
}