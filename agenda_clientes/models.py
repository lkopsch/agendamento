from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User

class Eventos(models.Model):
    title = models.CharField(max_length=200)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField(null=True, blank=True)
    name = models.CharField(max_length=30,null=True, blank=True)
    fone = models.CharField(max_length=15,null=True, blank=True)
    email = models.CharField(max_length=60,null=True, blank=True)
    id_user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, db_column='id_user')


    def save(self, *args, **kwargs):
        # Se 'end' não for fornecido, calcula o fim como 1 hora após o início
        if not self.end_time and self.start_time:
            self.end_time = self.start_time + timezone.timedelta(hours=1)  # Duração padrão de 1 hora
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title
    
    @staticmethod
    def verificar_vagas(date):
        # Conta quantos agendamentos existem para a data fornecida
        agendamentos_no_dia = Eventos.objects.filter(date=date).count()
        # Se tiver 8 ou mais agendamentos, não há vagas
        if agendamentos_no_dia >= 8:
            return "Não há mais vagas"
        else:
            return "Há vagas"