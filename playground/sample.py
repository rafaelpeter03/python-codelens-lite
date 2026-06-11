from enum import StrEnum

class MyClass:
    def my_method(self):
        pass

def my_function():
    obj = MyClass()
    obj.my_method()

my_function()



def funcao_teste():
    print("Esta é a função de teste do outro módulo.")


class MotherClass(StrEnum):
    Name = "Maria"
    AGE = 30

class Other(MotherClass): 
      ESPECIAL = "especial"

class Teste():

    def metodo_teste():
        print("Este é um método de teste do outro módulo.")


oi =  Teste.metodo_teste()

class TipoPedido(StrEnum):
    GERAL = "GERAL"
    ESPECIAL = "ESPECIAL"

def outra_funcao(teste: TipoPedido):
    print("Esta é outra função do outro módulo.")

    teste = funcao_teste()
    print(teste)

    teste = TipoPedido.GERAL

    teste = TipoPedido.ESPECIAL
