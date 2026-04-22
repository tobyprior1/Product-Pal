import { toPng } from "html-to-image"
import { jsPDF } from "jspdf"

export async function exportToPNG(elementId: string, filename: string = "export.png") {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error("Element not found:", elementId)
    return
  }

  try {
    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    })

    const link = document.createElement("a")
    link.download = filename
    link.href = dataUrl
    link.click()
  } catch (error) {
    console.error("Error exporting PNG:", error)
    throw error
  }
}

export async function exportToPDF(elementId: string, filename: string = "export.pdf") {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error("Element not found:", elementId)
    return
  }

  try {
    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    })

    // A3 landscape dimensions in mm
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a3",
    })

    const imgWidth = 420 // A3 landscape width
    const imgHeight = 297 // A3 landscape height

    pdf.addImage(dataUrl, "PNG", 0, 0, imgWidth, imgHeight)
    pdf.save(filename)
  } catch (error) {
    console.error("Error exporting PDF:", error)
    throw error
  }
}
