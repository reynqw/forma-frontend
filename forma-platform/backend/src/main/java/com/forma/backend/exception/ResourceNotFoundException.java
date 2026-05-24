package com.forma.backend.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) { super(message); }
    public ResourceNotFoundException(String entity, Long id) {
        super(entity + " с id=" + id + " не найден");
    }
}
