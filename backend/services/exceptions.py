class ServiceError(Exception):
    """Parent error for problems in the service layer."""


class NotFoundError(ServiceError):
    """Nothing was found, or this user isn't allowed to know it exists."""


class ForbiddenError(ServiceError):
    """This exists, but this user isn't allowed to change it."""


class ValidationError(ServiceError):
    """The request data isn't valid."""


class UnauthorizedError(ServiceError):
    """Login failed or the user isn't signed in."""


class EmailAlreadyExists(ServiceError):
    """This email already has an account."""
