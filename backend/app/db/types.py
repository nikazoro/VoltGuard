from sqlalchemy.types import UserDefinedType


class Point(UserDefinedType):
    def get_col_spec(self, **kw):
        return "POINT SRID 4326"
