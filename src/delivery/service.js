import { CODES } from "../constants.js";
import ServiceRepository from "../repository/service.js";

export default new class ServiceDelivery {
    async status(request, reply) {
        const callback = (service) => reply.code(CODES.OK).send(service);
        ServiceRepository.status(callback);
    }

    async clear(request, reply) {
        const callback = () => reply.code(CODES.OK).send(null);
        ServiceRepository.clear(callback);
    }
}