from django.db import models


class Scheme(models.Model):
    name = models.CharField('название', max_length=255)
    created_at = models.DateTimeField('создана', auto_now_add=True)
    updated_at = models.DateTimeField('изменена', auto_now=True)

    class Meta:
        ordering = ['-updated_at', '-id']
        verbose_name = 'схема'
        verbose_name_plural = 'схемы'

    def __str__(self) -> str:
        return self.name


class SchemeContent(models.Model):
    scheme = models.OneToOneField(
        Scheme,
        on_delete=models.CASCADE,
        related_name='content',
        verbose_name='схема',
    )
    payload = models.TextField('содержание', default='{"nodes":[],"edges":[]}')
    updated_at = models.DateTimeField('изменено', auto_now=True)

    class Meta:
        verbose_name = 'содержание схемы'
        verbose_name_plural = 'содержания схем'

    def __str__(self) -> str:
        return f'Содержание «{self.scheme.name}»'
