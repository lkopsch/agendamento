from django.urls import path
from .views import *

urlpatterns = [
    path('', home, name="home"),
    path('login/', login_view, name="login"),
    path('signup/', signup_view, name="signup"),
    path('logout/', logout_view, name='logout'),
    path('horarios/', horarios, name='horarios'),
    path('eventos/', get_eventos, name='get_eventos'),
    path('criar-evento/', criar_evento, name='criar_evento'),
    path('eventos-crus/', eventos_crus, name='eventos_crus'),
    path('verificar_vagas/<str:dia>/', verificar_vagas_view, name='verificar_vagas'),
]