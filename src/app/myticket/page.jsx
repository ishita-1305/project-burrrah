/* eslint-disable */
'use client'
import { get, push, ref, update } from 'firebase/database'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../../firebase/firebase'
import { useRouter } from 'next/navigation'
import React, { useContext, useEffect, useState } from 'react'
import '../styles/globals.css'
import { SubmitButton } from '../components/shared/SubmitButton'

import { database } from '../../firebase/firebase'
import Modal from '../components/Ticket/modal'
import InnerTicket from '../components/Ticket/ticketComp'
import { Navbar } from '../components/marginals/Navbar'
import { AuthContext } from '../context/AuthContext'
import { GlobalButton } from '../components/shared/GlobalButton'
import {
  TicketPage,
  TicketContainer,
  FormBg,
  FormSection,
  FormText,
  Input,
  PreviewBg,
  PreviewCont,
  GridCont,
  GridLines,
  TicketCompontent,
  ArrayHolder,
  ColorText,
  ColorArray,
  ClrButton,
  PreviewButton,
  ShareButton,
  ModalPage
} from './ticket.styles'

const MyTicketPage = () => {
  const colors = ['#206EA6', '#BBD3D9', '#4C1077', '#FECF29', '#14F195']

  const rows = 1
  const columns = 16
  const { currentUser } = useContext(AuthContext)
  const router = useRouter()

  const [ticketInfo, setTicketInfo] = useState({
    name: '',
    teamName: '',
    email: '',
    bgcolor: '',
    ticketId: ''
  })

  const [existingTicketKey, setExistingTicketKey] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/')
      }
    })
    return () => {
      unsubscribe() // Unsubscribe from the event when the component unmounts
    }
  }, [currentUser, router])

  useEffect(() => {
    if (currentUser === null) {
      // Authentication state is still loading
      return
    }
    if (!currentUser) {
      router.push('/')
      return
    }

    // Fetch existing ticket
    const ticketsRef = ref(database, `tickets/${currentUser.uid}`)
    get(ticketsRef).then((snapshot) => {
      if (snapshot.exists()) {
        const tickets = snapshot.val()
        const lastTicketKey = Object.keys(tickets).pop()
        setTicketInfo({
          name: tickets[lastTicketKey].name || currentUser.displayName,
          teamName: tickets[lastTicketKey].teamName,
          email: tickets[lastTicketKey].email,
          bgcolor: tickets[lastTicketKey].bgcolor,
          ticketId: tickets[lastTicketKey].ticketId
        })
        setExistingTicketKey(lastTicketKey)
      }
    })
  }, [currentUser, router])

  const [showModal, setShowModal] = existingTicketKey ? useState(true) : useState(false)

  const handleChange = (e) => {
    setTicketInfo({ ...ticketInfo, [e.target.name]: e.target.value })
  }

  const generateTicket = () => {
    if (currentUser) {
      const ticketRef = ref(database, `tickets/${currentUser.uid}`)
      const updateRef = existingTicketKey
        ? ref(database, `tickets/${currentUser.uid}/${existingTicketKey}`)
        : push(ticketRef)

      // Use a promise to wait for the update operation to complete
      const updatePromise = update(updateRef, {
        ...ticketInfo,
        email: currentUser.email,
        ticketId: existingTicketKey ? ticketInfo.ticketId : ticketInfo.ticketId + 1
      })
      updatePromise.then(() => {
        setShowModal(true)
      })
    }
  }

  return (
    <>
      <Navbar />
      <TicketPage>
        <TicketContainer>
          <FormBg>
            <FormSection>
              <FormText>Your name:</FormText>
              <Input
                type="text"
                name="name"
                placeholder="Name"
                value={ticketInfo.name}
                onChange={handleChange}
              />
              <FormText>Team name:</FormText>
              <Input
                type="text"
                name="teamName"
                placeholder="Team Name"
                value={ticketInfo.teamName}
                onChange={handleChange}
              />

              <></>
              <SubmitButton
                onClick={() => {
                  generateTicket()(existingTicketKey ? setShowModal(true) : null)
                }}
              >
                {existingTicketKey ? 'Update Ticket' : 'Generate Ticket'}
              </SubmitButton>
            </FormSection>
          </FormBg>

          <PreviewBg>
            <PreviewCont>
              <GridCont>
                {Array.from({ length: rows * columns }, (_, index) => (
                  <GridLines key={index}></GridLines>
                ))}
                <TicketCompontent>
                  <InnerTicket
                    user_name={ticketInfo.name || 'Your Name'}
                    team_name={ticketInfo.teamName || 'Your Team Name'}
                    ticket_num={ticketInfo.ticketId || 550000}
                    ticket_img={ticketInfo.bgcolor || '#206EA6'}
                    lightBg={colors.indexOf(ticketInfo.bgcolor) === 1 ? true : false}
                  />
                </TicketCompontent>
              </GridCont>
            </PreviewCont>
          </PreviewBg>
        </TicketContainer>
        <ArrayHolder>
          <ColorText>choose color: </ColorText>
          <ColorArray>
            {colors.map((c) => (
              <ClrButton
                key={c}
                style={{ backgroundColor: c }}
                onClick={() => {
                  setTicketInfo({ ...ticketInfo, bgcolor: c })
                }}
              />
            ))}
          </ColorArray>
        </ArrayHolder>

        <PreviewButton onClick={() => setShowModal(true)}>Preview your Ticket</PreviewButton>
        <ShareButton>Share your Ticket</ShareButton>
      </TicketPage>
      {showModal && (
        <ModalPage>
          <GlobalButton onClick={() => setShowModal(false)}>Edit Ticket</GlobalButton>
          <Modal show={showModal} onClose={() => setShowModal(false)}>
            <InnerTicket
              user_name={ticketInfo.name || 'Your Name'}
              team_name={ticketInfo.teamName || 'Your Team Name'}
              ticket_num={ticketInfo.ticketId || 550000}
              ticket_img={ticketInfo.bgcolor || '#206EA6'}
              lightBg={colors.indexOf(ticketInfo.bgcolor) === 1 ? true : false}
            />
          </Modal>
        </ModalPage>
      )}
    </>
  )
}
export default MyTicketPage
