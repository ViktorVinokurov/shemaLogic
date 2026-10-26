from django.contrib import admin

from .models import Scheme, SchemeContent


class SchemeContentInline(admin.StackedInline):
    model = SchemeContent
    extra = 0


@admin.register(Scheme)
class SchemeAdmin(admin.ModelAdmin):
    list_display = ('name', 'updated_at', 'created_at')
    search_fields = ('name',)
    inlines = [SchemeContentInline]
