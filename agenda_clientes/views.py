from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.shortcuts import render, redirect
from datetime import datetime, timedelta, date
from .models import *
import json

def home(request):
    return render(request, 'home.html')

def login_view(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('home')
        else:
            return render(request, 'login.html', {'error': 'Credenciais inválidas'})
    return render(request, 'login.html')

def signup_view(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']

        # Verificar se o usuário já existe
        if User.objects.filter(username=username).exists():
            return render(request, 'signup.html', {'error': 'Usuário já existe'})

        # Criar o usuário
        user = User.objects.create_user(username=username, password=password)

        # Autenticar e logar o usuário automaticamente
        login(request, user) 

        # Redireciona para a página inicial
        return redirect('home')

    return render(request, 'signup.html')

def logout_view(request):
    logout(request)  # Faz o logout do usuário
    return redirect('home')  # Redireciona para a página inicial

def horarios(request):
    return render(request, 'horarios.html')

def get_eventos(request):
    # Pega todos os eventos do banco de dados
    eventos = Eventos.objects.all()

    # Formata os eventos no formato necessário para o FullCalendar
    eventos_list = []
    for evento in eventos:
        # Combina a data e o tempo de início e fim para formar os valores de datetime
        start_datetime = datetime.combine(evento.date, evento.start_time).isoformat()
        end_datetime = None
        if evento.end_time:
            end_datetime = datetime.combine(evento.date, evento.end_time).isoformat()

        eventos_list.append({
            'id': evento.id,
            'title': evento.title,
            'start': start_datetime,
            'end': end_datetime,
            'allDay': False 
        })

    # Retorna os eventos como JSON
    return JsonResponse(eventos_list, safe=False)

@csrf_exempt
def criar_evento(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            # Captura os dados do evento
            title = data.get('title')
            start = data.get('start')  # Isso incluirá a data e o horário de início no formato ISO

            # Se o usuário estiver logado, obtém o id, nome e email da sessão autenticada
            if request.user.is_authenticated:
                name = user.first_name or user.username  # Pega o nome do usuário logado (first_name ou username)
                email = user.email  # Pega o email do usuário logado
            else:
                # Caso contrário, pega os dados enviados do frontend
                user = None  # Usuário não autenticado
                name = data.get('name')
                email = data.get('email')

            # Verifica se os dados obrigatórios estão presentes
            if not title or not start or not name or not email:
                return JsonResponse({'status': 'error', 'message': 'Dados insuficientes'}, status=400)

            # Converte a string ISO de início para os campos de data e hora
            start_datetime = datetime.fromisoformat(start)  # ISO format (yyyy-mm-ddThh:mm:ss)
            date = start_datetime.date()
            start_time = start_datetime.time()

            # Como o horário de término é sempre uma hora depois, adicionamos 1 hora
            end_time = (datetime.combine(date, start_time) + timedelta(hours=1)).time()

            # Cria o evento no banco de dados
            evento = Eventos.objects.create(
                title=title,
                date=date,
                start_time=start_time,
                end_time=end_time,
                name=name,
                email=email,
            )
            return JsonResponse({'status': 'success', 'evento_id': evento.id})

        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

def eventos_crus(request):
    date = request.GET.get('date')  # Pega a data da query string
    if date:
        eventos = Eventos.objects.filter(date=date)  # Filtra os eventos pela data
    else:
        eventos = Eventos.objects.all()  # Retorna todos se não houver data

    eventos_list = []
    for evento in eventos:
        eventos_list.append({
            'id': evento.id,
            'date': evento.date.isoformat(),
            'start_time': evento.start_time.isoformat(),
            'end_time': evento.end_time.isoformat() if evento.end_time else None,
        })

    return JsonResponse(eventos_list, safe=False)

def verificar_vagas_view(request, dia):
    # Converte a string da URL para um objeto date
    data = date.fromisoformat(dia)
    
    # Conta o número de agendamentos no dia
    agendamentos_no_dia = Eventos.objects.filter(date=data).count()
    
    # Chama o método verificar_vagas para a data fornecida
    status_vagas = Eventos.verificar_vagas(data)
    
    vagas_disponiveis = status_vagas == "Há vagas"
    
    # Retorna um JSON com a informação de vagas e a quantidade de agendamentos
    return JsonResponse({
        'vagas_disponiveis': vagas_disponiveis,
        'status_vagas': status_vagas,
        'agendamentos_no_dia': agendamentos_no_dia
    })