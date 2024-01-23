import { FiPlusCircle } from 'react-icons/fi';
import Header from '../../components/Header';
import Title from '../../components/Title';
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/auth';
import { db } from '../../services/firebaseConnection';
import { query, collection, where, getDocs, getDoc, doc, addDoc, updateDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './new.css';

const listRef = collection(db, 'customers');

export default function New(){

    const { user } = useContext(AuthContext)
    const { id } = useParams()
    const navigate = useNavigate()

    const [customers, setCustomers] = useState([])
    const [loadCustomer, setLoadCustomer] = useState(true)
    const [customerSelected, setCustomerSelected] = useState(0)

    const [complemento, setComplemento] = useState('')
    const [assunto, setAssunto] = useState('Suporte')
    const [status, setStatus] = useState('Aberto')
    const [idCustomer, setIdCustomer] = useState(false)

    useEffect(() => {
        async function loadCustomers() {
            const q = query(collection(db, 'customers'), where('userId', '==', user.uid));
            const querySnapshot = await getDocs(q);
        
            let lista = [];
        
            querySnapshot.forEach((doc) => {
                lista.push({
                    id: doc.id,
                    nomeFantasia: doc.data().nomeFantasia
                });
            });
        
            if (querySnapshot.docs.size === 0) {
                console.log('Nenhuma empresa encontrada');
                setCustomers([{ id: '1', nomeFantasia: 'Freela' }]);
                setLoadCustomer(false);
                return;
            }
        
            setCustomers(lista);
            setLoadCustomer(false);
        
            if (id) {
                loadId(lista);
            }
        }

        loadCustomers();

    }, [id])

    async function loadId(lista) {

        const docRef = doc(db, 'chamados', id);

        await getDoc(docRef)
        .then((snapshot) => {
            setAssunto(snapshot.data().assunto)
            setStatus(snapshot.data().status)
            setComplemento(snapshot.data().complemento)

            let index = lista.findIndex(item => item.id === snapshot.data().clienteId)
            setCustomerSelected(index);
            setIdCustomer(true)
        })
        .catch((error) => {
            console.log(error)
            setIdCustomer(false)
        })
    }

    function handleOptionChange(e){
        setStatus(e.target.value)
    }

    function handleChangeSelect(e){
        setAssunto(e.target.value)
    }

    function handleChangeCustomer(e) {
        setCustomerSelected(e.target.value)
        console.log(customers[e.target.value].nomeFantasia)
    }

    async function handleRegister(e){
        e.preventDefault()

        if(idCustomer) {
            //atualizando chamado
            const docRef = doc(db, 'chamados', id)
            await updateDoc(docRef,{
                cliente: customers[customerSelected].nomeFantasia,
                clienteId: customers[customerSelected].id,
                assunto: assunto,
                complemento: complemento,
                status: status,
                userId: user.uid
            })
            .then(() => {
                toast.info('Chamado atualizado com sucesso!')
                setCustomerSelected(0)
                setComplemento('')
                navigate('/dashboard')
            })
            .catch((error) => {
                toast.error('Erro ao atualizar esse chamado!')
            })

            return;
        }

        //Registrar um chamado
        await addDoc(collection(db, 'chamados'), {
            created: new Date(),
            cliente: customers[customerSelected].nomeFantasia,
            clienteId: customers[customerSelected].id,
            assunto: assunto,
            complemento: complemento,
            status: status,
            userId: user.uid
        })
        .then(() => {
            toast.success('Chamado registrado!')
            setComplemento('')
            setCustomerSelected(0)
        })
        .catch((error) => {
            toast.error('Erro ao registrar o chamado!')
        })
    }
    
    return(
        <div>

            <Header/>

            <div className='content'>

                <Title name={id ? 'Editando chamado' : 'Novo chamado'}>
                    <FiPlusCircle size={25}/>
                </Title>

                <div className='container'>

                    <form className='form-profile' onSubmit={handleRegister}>

                        <label>Clientes</label>
                        {
                            loadCustomer ? (
                                <input type='text' disabled={true} value='Carregando...' />
                            ) : (
                                <select value={customerSelected} onChange={handleChangeCustomer}>
                                    { customers.map((item, index) => {
                                        return(
                                            <option key={index} value={index}>
                                                { item.nomeFantasia }
                                            </option>
                                        )
                                    })}
                                </select>
                            )
                        }

                        <label>Assunto</label>
                        <select value={assunto} onChange={handleChangeSelect}>
                            <option value='Suporte'>Suporte</option>
                            <option value='Visita Técnica'>Visita Técnica</option>
                            <option value='Financeiro'>Financeiro</option>
                        </select>

                        <label>Status</label>
                        <div className='status'>

                            <input
                                type='radio'
                                name='radio'
                                value='Aberto'
                                onChange={handleOptionChange}
                                checked={ status === 'Aberto' }
                            />
                            <span>Em aberto</span>

                            <input
                                type='radio'
                                name='radio'
                                value='Progresso'
                                onChange={handleOptionChange}
                                checked={ status === 'Progresso' }
                            />
                            <span>Progresso</span>

                            <input
                                type='radio'
                                name='radio'
                                value='Atendido'
                                onChange={handleOptionChange}
                                checked={ status === 'Atendido' }
                            />
                            <span>Atendido</span>

                        </div>

                        <label>Complemento</label>
                        <textarea
                            type='text'
                            placeholder='Descreva seu problema (opcional)'
                            value={complemento}
                            onChange={ (e) => setComplemento(e.target.value) }
                        />

                        {id ? (

                            <button type='submit'>Editar</button>

                        ): (

                            <button type='submit'>Registrar</button>

                        )}

                    </form>

                </div>

            </div>

        </div>
    )
}